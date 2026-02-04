import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceStrict } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseUTC(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date();

  // Normalize format (replace space with T)
  let normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');

  // Ensure it has a Z suffix for UTC
  if (!normalized.endsWith('Z') && !normalized.includes('+')) {
    normalized += 'Z';
  }

  const date = new Date(normalized);
  return isNaN(date.getTime()) ? new Date() : date;
}

/**
 * Formats seconds into a descriptive string including seconds.
 * Example: 909 seconds -> "15 min 9 sec"
 */
export function formatUptime(seconds: number) {
  if (!seconds || seconds <= 0) return '0 sec';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes} min`);
  if (secs > 0 || (parts.length === 0)) parts.push(`${secs} sec`);

  if (parts.length > 1) {
    const last = parts.pop();
    return parts.join(' ') + ' and ' + last;
  }
  return parts[0];
}

/**
 * Calculates relative time between two dates and returns a string like "15 min 9 sec"
 * if the difference is small, or standard relative time if long.
 */
export function formatDetailedDuration(startTimeStr: string | null | undefined, serverTimeStr?: string | null) {
  if (!startTimeStr) return '—';

  const start = parseUTC(startTimeStr).getTime();
  const now = serverTimeStr ? parseUTC(serverTimeStr).getTime() : Date.now();

  const diffSeconds = Math.max(0, Math.floor((now - start) / 1000));
  return formatUptime(diffSeconds);
}

export function formatRelativeTime(dateStr: string | null | undefined, serverTimeStr?: string | null) {
  if (!dateStr) return 'Never';

  const targetDate = parseUTC(dateStr);
  const referenceDate = serverTimeStr ? parseUTC(serverTimeStr) : new Date();

  try {
    // Use formatDistanceStrict for standard relative strings (e.g. "5 minutes ago")
    return formatDistanceStrict(targetDate, referenceDate, { addSuffix: true });
  } catch (e) {
    return 'Just now';
  }
}

/**
 * Maps raw process names or paths to human-readable application names in UPPERCASE.
 */
export function formatAppName(name: string): string {
  if (!name) return 'UNKNOWN APPLICATION';

  // Extract filename if it's a full path
  let baseName = name.split(/[\\/]/).pop() || name;
  const upperRaw = baseName.toUpperCase().replace(/\.EXE$/, '');

  const mapping: Record<string, string> = {
    'WHATSAPP': 'WHATSAPP MESSENGER',
    'LANGUAGE_SERVER_WINDOWS_X64': 'VISUAL STUDIO CODE',
    'PYREFLY': 'PYTHON PROGRAM',
    'PYTHON': 'PYTHON DEVELOPMENT',
    'NODE': 'NODE.JS ENGINE',
    'ESBUILD': 'BUILD PROCESSOR',
    'CHROME': 'GOOGLE CHROME',
    'FIREFOX': 'MOZILLA FIREFOX',
    'MSEDGE': 'MICROSOFT EDGE',
    'ZOOM': 'ZOOM MEETING',
    'TEAMS': 'MICROSOFT TEAMS',
    'IDEA64': 'INTELLIJ IDEA',
    'PYCHARM64': 'PYCHARM IDE',
    'CODE': 'VISUAL STUDIO CODE',
    'CMD': 'COMMAND PROMPT',
    'POWERSHELL': 'POWERSHELL TERMINAL',
    'EXPLORER': 'WINDOWS EXPLORER',
    'TASKSCHD': 'TASK SCHEDULER',
    'NOTEPAD': 'NOTEPAD EDITOR',
    'NOTEPAD++': 'NOTEPAD++ EDITOR',
    'SYSTEM': 'WINDOWS KERNEL',
    'SVCHOST': 'WINDOWS SERVICES',
    'WININIT': 'SYSTEM INITIALIZER',
    'CSRSS': 'RUNTIME SUBSYSTEM',
    'LSASS': 'SECURITY CONTROLLER',
    'DISCORD': 'DISCORD CHAT',
    'SLACK': 'SLACK WORKSPACE',
    'SPOTIFY': 'SPOTIFY MUSIC',
    'VLC': 'VLC MEDIA PLAYER',
    'STEAM': 'STEAM GAMING',
    'OBS64': 'OBS RECORDING STUDIO',
    'SKYPE': 'SKYPE COMMUNICATIONS',
    'TELEGRAM': 'TELEGRAM MESSENGER',
    'UTORRENT': 'UTORRENT CLIENT',
    'BITTORRENT': 'BITTORRENT CLIENT',
    'WINRAR': 'WINRAR ARCHIVER',
    '7Z': '7-ZIP ARCHIVER',
    'EXCEL': 'MICROSOFT EXCEL',
    'WINWORD': 'MICROSOFT WORD',
    'POWERPNT': 'MICROSOFT POWERPOINT',
    'OUTLOOK': 'MICROSOFT OUTLOOK',
    'ONENOTE': 'MICROSOFT ONENOTE',
    'PUBLISHER': 'MICROSOFT PUBLISHER',
    'MSACCESS': 'MICROSOFT ACCESS',
    'ACROBAT': 'ADOBE ACROBAT READER',
    'PHOTOSHOP': 'ADOBE PHOTOSHOP',
    'ILLUSTRATOR': 'ADOBE ILLUSTRATOR',
    'PREMIERE': 'ADOBE PREMIERE PRO',
    'BRAVE': 'BRAVE BROWSER',
    'OPERA': 'OPERA BROWSER',
    'TASKMGR': 'TASK MANAGER',
    'REGSVR32': 'SYSTEM REGISTER',
    'RUNDLL32': 'WINDOWS HOST PROCESS',
    'MSMPENG': 'WINDOWS DEFENDER ANTIVIRUS',
    'SEARCHINDEXER': 'WINDOWS SEARCH INDEXER',
    'WMIPRVSE': 'WMI MONITORING SERVICE',
    'CONHOST': 'CONSOLE WINDOW HOST',
    'WINLOGON': 'USER LOGON SERVICE',
    'USERINIT': 'USER SESSION INITIALIZER',
    'COMPPKGSRV': 'COMPONENT PACKAGE SERVICE',
    'SETUP': 'SOFTWARE INSTALLATION ENGINE',
    'RUNONCE': 'STARTUP TASK EXECUTOR',
    'RG': 'SYSTEM SEARCH ENGINE',
    'SPPSVC': 'WINDOWS LICENSE SERVICE',
    'SPPEXTCOMOBJ': 'LICENSE AUTHENTICATION HOST',
    'ICACLS': 'FILE PERMISSIONS MANAGER',
    'HELPPANE': 'WINDOWS HELP CONTENT',
    'SEARCHHOST': 'WINDOWS SEARCH ENGINE',
    'SHELLEXPERIENCEHOST': 'WINDOWS SHELL INTERFACE',
    'STARTMENUXP': 'START MENU SERVICE',
    'SMARTSCREEN': 'WINDOWS SECURITY SCREEN',
    'DWM': 'DESKTOP WINDOW MANAGER',
    'SPOOLSV': 'PRINTER SPOOLER SERVICE',
    'TASKSCHOSTW': 'TASK HOST PROCESS',
    'DLLHOST': 'EXTENDED COMPONENT HOST',
    'RUNTIMEBROKER': 'SYSTEM PERMISSIONS HANDLER',
    'SIHOVERLAY': 'SYSTEM INTERFACE OVERLAY',
    'CTFMON': 'INPUT LANGUAGE INDICATOR',
    'IDMAN': 'INTERNET DOWNLOAD MANAGER',
    'ANYDESK': 'ANYDESK REMOTE',
    'TEAMVIEWER': 'TEAMVIEWER REMOTE',
    'POSTMAN': 'POSTMAN API PLATFORM',
    'DOCKER': 'DOCKER CONTAINER ENGINE',
    'GIT': 'GIT VERSION CONTROL',
    'STEXT': 'SUBLIME TEXT EDITOR',
    'VBOXHEADLESS': 'VIRTUALBOX SYSTEM',
    'VMWARE': 'VMWARE WORKSTATION',
    'FONTDRVHOST': 'FONT FRAMEWORK HOST',
    'AUDIODG': 'WINDOWS AUDIO ISOLATION',
    'MEMORY COMPRESSION': 'VIRTUAL MEMORY MANAGER',
    'REGISTRY': 'SYSTEM CONFIGURATION CORE',
    'APPLICATIONFRAMEHOST': 'UNIVERSAL APP FRAMEWORK',
    'SDRSVC': 'WINDOWS BACKUP SERVICE',
    'WBENGINE': 'SYSTEM RECOVERY ENGINE',
    'WUDO': 'WINDOWS UPDATE OPTIMIZER',
    'SEDUI': 'SYSTEM UPDATER INTERFACE',
    'IUSR': 'SYSTEM USER SERVICE',
    'STUDIO64': 'ANDROID STUDIO',
    'MATLAB': 'MATLAB ENGINE',
    'CODEBLOCKS': 'CODE::BLOCKS IDE',
    'DEVCPP': 'DEV-C++ IDE',
    'PUTTY': 'PUTTY SSH CLIENT',
    'FILEZILLA': 'FILEZILLA FTP',
    'WINSCP': 'WINSCP CLIENT',
    'XAMPP_CONTROL': 'XAMPP CONTROL PANEL',
    'HTTPD': 'APACHE SERVER',
    'MYSQLD': 'MYSQL DATABASE',
    'POSTGRES': 'POSTGRESQL DATABASE',
    'PGADMIN4': 'PGADMIN DATABASE TOOL',
    'VALORANT': 'VALORANT GAME',
    'GTA5': 'GTA V GAME',
    'MINECRAFT': 'MINECRAFT GAME',
    'UNITY': 'UNITY GAME ENGINE',
    'UNREALEDITOR': 'UNREAL ENGINE EDITOR',
    'GITHUBDESKTOP': 'GITHUB DESKTOP',
    'GIT BASH': 'GIT BASH TERMINAL',
    'OVERLEAF': 'OVERLEAF EDITOR',
    'TEXSTUDIO': 'TEXSTUDIO LATEX',
    'WINEDT': 'WINEDT LATEX',
    'MIKTEX': 'MIKTEX SYSTEM',
    'STATA': 'STATA ANALYTICS',
    'SPSS': 'IBM SPSS STATISTICS',
    'MINITAB': 'MINITAB STATISTICAL',
    'PROTEUS': 'PROTEUS PCB DESIGN',
    'QUARTUS': 'INTEL QUARTUS PRIME',
    'VIVADO': 'XILINX VIVADO',
    'MULTISIM': 'NI MULTISIM',
    'LABVIEW': 'NI LABVIEW',
    'ANSYS': 'ANSYS SIMULATION',
    'SOLIDWORKS': 'SOLIDWORKS CAD',
    'AUTOCAD': 'AUTODESK AUTOCAD',
    'REVIT': 'AUTODESK REVIT',
    'MAYA': 'AUTODESK MAYA',
    '3DSMAX': 'AUTODESK 3DS MAX',
  };

  if (mapping[upperRaw]) {
    return mapping[upperRaw];
  }

  // Fallback: Clean up and convert to UPPERCASE
  return upperRaw
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .split(' ')
    .filter(Boolean)
    .join(' ');
}
