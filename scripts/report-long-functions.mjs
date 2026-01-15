#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import ts from 'typescript';

const DEFAULT_MAX_LINES = 20;
const EXCLUDED_SUFFIXES = ['.spec.ts', '.spec.tsx'];

async function main() {
  const { targetPath, maxLines } = parseArgs(process.argv.slice(2));
  if (!targetPath) {
    console.error('Usage: node scripts/report-long-functions.mjs <path> [--max-lines=20]');
    process.exit(1);
  }

  const absoluteTarget = path.resolve(targetPath);
  const stat = await fs.stat(absoluteTarget).catch(() => null);
  if (!stat) {
    console.error(`Path not found: ${absoluteTarget}`);
    process.exit(1);
  }

  const files = stat.isDirectory()
    ? await collectFiles(absoluteTarget)
    : shouldAnalyzeFile(absoluteTarget)
      ? [absoluteTarget]
      : [];

  if (files.length === 0) {
    console.log('No TypeScript source files found for analysis.');
    return;
  }

  const reports = files.flatMap((file) => analyzeFile(file, maxLines));
  if (reports.length === 0) {
    console.log(`All functions are within the ${maxLines}-line threshold.`);
    return;
  }

  reports
    .sort((a, b) => (a.file === b.file ? a.startLine - b.startLine : a.file.localeCompare(b.file)))
    .forEach((report) => {
      console.log(`${path.relative(process.cwd(), report.file)}:${report.startLine}-${report.endLine}`);
      console.log(`  ${report.kind} ${report.name ?? '<anonymous>'} → ${report.lineCount} lines`);
    });
}

function parseArgs(args) {
  let targetPath = '';
  let maxLines = DEFAULT_MAX_LINES;

  for (const arg of args) {
    if (arg.startsWith('--max-lines=')) {
      const value = Number.parseInt(arg.split('=')[1], 10);
      if (!Number.isNaN(value) && value > 0) {
        maxLines = value;
      }
      continue;
    }

    if (!targetPath) {
      targetPath = arg;
    }
  }

  return { targetPath, maxLines };
}

async function collectFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return collectFiles(fullPath);
      }
      return shouldAnalyzeFile(fullPath) ? [fullPath] : [];
    }),
  );
  return files.flat();
}

function shouldAnalyzeFile(filePath) {
  return filePath.endsWith('.ts') && !EXCLUDED_SUFFIXES.some((suffix) => filePath.endsWith(suffix));
}

function analyzeFile(file, maxLines) {
  const sourceText = ts.sys.readFile(file);
  if (!sourceText) {
    return [];
  }

  const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true);
  const reports = [];

  const visit = (node) => {
    const kind = classifyNode(node);
    if (kind) {
      const { startLine, endLine, lineCount } = getLineMetrics(node, sourceFile);
      if (lineCount > maxLines) {
        reports.push({
          file,
          startLine,
          endLine,
          lineCount,
          kind,
          name: getNodeName(node, sourceFile),
        });
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return reports;
}

function classifyNode(node) {
  switch (node.kind) {
    case ts.SyntaxKind.FunctionDeclaration:
      return 'function';
    case ts.SyntaxKind.MethodDeclaration:
      return 'method';
    case ts.SyntaxKind.ArrowFunction:
      return 'arrow function';
    case ts.SyntaxKind.FunctionExpression:
      return 'function expression';
    default:
      return null;
  }
}

function getLineMetrics(node, sourceFile) {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
  return {
    startLine: start.line + 1,
    endLine: end.line + 1,
    lineCount: end.line - start.line + 1,
  };
}

function getNodeName(node, sourceFile) {
  if ('name' in node && node.name) {
    return node.name.getText(sourceFile);
  }

  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    const parent = node.parent;
    if (ts.isVariableDeclaration(parent) && parent.name) {
      return parent.name.getText(sourceFile);
    }
    if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) {
      return parent.name.text;
    }
  }

  return undefined;
}

await main();
