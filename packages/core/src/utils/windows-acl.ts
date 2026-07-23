import { execFile } from "node:child_process";
import os from "node:os";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// NT AUTHORITY\SYSTEM 的已知 SID；* 前缀告诉 icacls 这是一个
// SID 而非账户名，因此可以在任何显示语言下正确解析。
const SYSTEM_SID = "*S-1-5-18";

/**
 * 在 Windows 上实现 POSIX 0o700 仅所有者的意图。Windows 的 fs.chmod 仅
 * 切换只读属性而不修改 ACL：授予当前用户和 SYSTEM 完全控制权限（可继承，
 * 新建子项也会覆盖），然后移除继承的 ACE。授权在重置继承之前执行，因此
 * 即使授权失败也不会将用户锁定在目录之外。设计为尽力而为：返回 false
 * 而不是抛出异常，使 ACL 工具问题不会阻止运行。在非 Windows 平台上无操作。
 */
export async function restrictDirToCurrentUser(
  dirPath: string,
): Promise<boolean> {
  if (process.platform !== "win32") {
    return false;
  }
  const userName = os.userInfo().username;
  try {
    await execFileAsync("icacls", [
      dirPath,
      "/grant:r",
      `${userName}:(OI)(CI)F`,
      `${SYSTEM_SID}:(OI)(CI)F`,
    ]);
    await execFileAsync("icacls", [dirPath, "/inheritance:r"]);
    return true;
  } catch {
    return false;
  }
}
