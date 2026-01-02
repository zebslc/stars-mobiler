# General Tips and Essential Knowledge

> Display tuning, replaying turns, saving games, exiting, and launch options.

---

## PLAYER SHOULD KNOW

TUNING STARS! TO YOUR DISPLAY RESOLUTION
The higher your screen resolution, the better Stars! will look. However, it will
run on any color VGA display.

1024 by 768 (or better)
For maximum playing pleasure.
- Use this menu command: View (Window Layout > Large ).
- If you use large fonts, you may need to specify View (Window Layout >
Medium).

800 by 600
This is the minimum recommended resolution.
1. Choose the menu item, View (Window Layout > Medium). If you’re using
large fonts, you may find that the small window layout works better for
you.
2. Resize each of the windows to optimize the information you need to see
at a glance.
3. If the screen still seems too cramped try hiding the Toolbar using the
menu item, View (Toolbar). Most of the Toolbar functions are available
using shortcut keystrokes.

4-2    GE T TI NGS TAR T ED

640 by 480 (VGA)
This is the minimum required resolution.
1. Use this menu command: View (Window Layout > Small ).
2. Resize each of the windows to optimize the information you need to see
at a glance.
3. Collapse tiles in the Command pane, expanding them when needed.
4. If the screen still seems too cramped try hiding the Toolbar using the
menu item View (Toolbar). Most of the Toolbar functions are available
using shortcut keystrokes.

## REPLAYING A PREVIOUS TURN

### Stars! allows you to save previous turns in case you need to resubmit a turn to

the host or replay the current turn. You can specify saving up to 999 turns
using the Backups option in the stars.ini file. If you don’t specify the number
of turns to backup, Stars! backs up only the previous turn. Once you save and
submit, Stars! saves the current turn as the most recent backup copy.

To start a turn using data from a previous turn (for example, the last turn
played):
1. Copy all files for the current game from the backup directory into the
playing directory. For example, if you originally saved the game under the
name of Nonstop, copy all files with Nonstop as the prefix. To ensure that
you are choosing the correct files, check the date/time stamp on the
backup directory.
2. Choose Open Game or File (Open). Select the player log file player turn
file (for example, nonstop.m1), and click OK. You should be back where
you started, although the universe will reflect the current positions of
other players.

SAVING YOUR GAME—WHAT IT MEANS

### Default Save Behavior

By default, saving a game saves only the current state of the current turn. The
previous turn’s data is saved in a directory called Backup, under the directory
in which you’re saving the game. Stars! creates the Backup directory

T H IN GS EVERY PLAYER SH O ULD K N OW   4-3

automatically. Each time you generate a turn, the old data in the Backup
directory is overwritten with the previous turn’s data.

### Saving the Current State of Your Game

Use the File (Save) menu item to save the current state of your game. This is
useful if you need to exit the game before you finish your turn. When you
restart Stars! just click on Continue Game to resume where you left off.

If you close the game before saving you will see this alert, you’ll be asked if
you wish to save before exiting.

### Saving More than One Previous Turn

If you’d like to save more than one previous turn for review or any other
purpose, do the following:
1. Open the stars.ini file for editing. It’s a plain text file located in your
Windows directory.
2. Under the [MISC] section, set the Backups option to a number of turns, between 1 and 999. If the Backups option isn’t present, go ahead and
type it in; for example:

Backups=50

Backup directories will be named Backup1 to BackupN. Old game files will
be stored in the backup directory according to the turn number. For example
when Backups=4 then the first turn would be backed up to the directory
backup1, the second to backup2, the third to backup3, the fourth to backup4, the fifth to backup1 and so on.

The stars.ini file is written into your Windows directory the first time you save
a Stars! game. It doesn’t exist before that time.

### Save and Submit

Multi-player Games Only
Use the File (Save and Submit ) command to save the current state of your
game and submit your turn. In multi-player games, this marks your turn as
finished so the host can auto-generate; Save does not.

4-4    GE T TI NG S TAR T ED

If you close the game before saving you’ll be asked if you wish to save and
submit your turn before exiting.

## EXITING THE GAME

Select File (Exit) or File (Close). If you’ve made changes since the beginning of
the turn, Stars! will prompt you to save or, if you’re in a multi-player game, to
save and submit your turn.

### Exiting Stars! the First Time

IMPORTANT: The first time you play Stars!, exit using the File (Exit) menu
item. This writes the stars.ini file to the Windows directory, saving game
options and helping to prevent that pesky serial number dialog from
appearing again.

### Exiting Stars! to Erase Changes

If you want to erase the changes you’ve made that turn, before you submit, do
the following:
1. Choose File (Close), without saving.
2. Select Open Game from the opening screen, then choose your player log
file from the Open File dialog. You’ll be back at the start of the turn you
just left.

Save vs. Save and Submit

### Multi-player Games Only

Use the File (Save and Submit) command to save the current state of your
game and submit your turn. In multi-player games, this marks your turn as
finished so the host can auto-generate; Save does not.

If you close the game before saving you’ll be asked if you wish to save and
submit your turn before exiting.

T H IN GS EV ERY PLAYER SH OULD K N OW                    4-5

## OPTIONS FOR LAUNCHING STARS!

Stars! can be launched from a DOS or Windows command line, using the
Stars! command only or with a variety of options. When using an option, you
must also supply either a player or host file name as an argument. You can
also supply only the player or host file name without any other options.

With or without options, supplying the file name causes Stars! to start without
displaying the splash screen (startup bitmap).

-s – start with battle sound effects turned off

-m – start with game music turned off

-t – try, then exit. If you specify a player file, this opens the newly generated
turn. If the turn hasn’t been generated yet, then Stars! exits. If you specify a
host file, this checks to see if all players have submitted their changes for the
turn. If they have, Stars! generates the new turn and exits. Otherwise, it just
exits.

-w –wait. If you specify a host file, this auto-generates the new turn as soon as
all players have submitted their changes. If you specify a player file, this waits
for the new turn to be generated. This option does not cause Stars! to exit.

-g –generate and exit. Specify a host file only. This forces the turn to generate
regardless of whether all players have submitted changes, then exits. You can’t
load a player file when you use this option.

-p password –supplies the password on the command line. You can use this
with a host file or a password-protected player file.

-x –Exit Windows when Stars! exits. This is a good match with the -b option if       The -x flag is for
you wish to create a script that automatically starts Windows, generates the         16-bit Windows
new turn, then exits Windows.                                                        only (3.1 or 3.11).

### Behavior of the -x

option on OS/2, -b gamelist_file –Generate turns for each game listed in the supplied file
Windows NT, or
name.                                                                                Windows 95 is
undefined and
-a game.def – Create a new game/universe based on the contents of game.def.          probably not what
This allows you to create new games from the command line. See Creating a            you want.
Universe from the Command Line on page 3-13 for more information.

-h – Causes Stars! to alway ask you for a password when you open a turn file.
This helps keep the wimps who can’t play without cheating out of your turn
files. This is especially useful for hot seat play.

4-6     GE T TI NGS TAR T ED

### Examples

stars! Filename              Load a player or host file, starting the game without
loading the splash screen.

stars! -w gamename.hst       Load the host file and enter Auto Generate mode.

stars! -w gamename.mN        Load the specified player file and wait for the host to
generate a new turn.

stars! -t gamename.mN        Load the specified player file; quit if the host has not yet
generated a new turn.

stars! -g gamename.hst       Load the host file, force a new turn and quit.

stars! -w -g gamename.hst Load the host file, wait for all players to submit turns, generate and quit.

stars! -t -g gamename.hst    Load the host file, generate a new turn only if all players
have submitted turns, then quit. If it generates the turn the
return value is 1; if the turn is not generated the value is 0.

stars! -t -b gamelist_file   Conditionally generate turns for a list of games.

stars! -x -b gamelist_file   Generate turns for each game listed in the supplied file
name, then exit Windows. Useful for BBS play

For example if your BBS is OS/2, NT or Windows-based you can launch Stars!
with the -b gamelist_file parameter to batch generate turns for multiple
games. Stars! will automatically exit when the last turn has been generated.

### The file listing the games must contain one game name per line including the

full path:

c:\games\stars!\play\frenzy.hst
c:\games\stars!\play\game.hst
c:\user\jeff\stars!\killer.hst

You can name this games list file anything you want. If you are running a
DOS-based BBS but have Windows installed on the machine, you can launch
Windows and Stars! from a nightly maintenance script similar to this:

win c:\games\stars!\stars!.exe -x -b c:\games\stars!\gamelist.txt

This will launch Windows and Stars!, generate a turn for each game listed in
gamelist.txt, then exit Stars! and Windows. This method is optimal for
Windows 3.1.

TH IN GS EVER Y PLAY ER SH O ULD KN O W   4-7

If you have Windows for Workgroups installed (Windows 3.11) you may want
ato use the win /n option:

win /n c:\games\stars!\stars!.exe -x -b c:\games\stars!\gamelist.txt

### This will prevent Windows from loading any of its network drivers and

suppress its login prompt. If you only need to generate a turn for a single
game you can still use the -g gamename.hst parameter with or without -x (use
-x with Windows 3.1 or 3.11only).

