/**
 * 用于分类 Node.js 文件系统错误的共享辅助函数。
 */

/**
 * 判断错误是否为"文件或目录不存在"（ENOENT）错误。
 */
export function isFileNotFoundError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

/**
 * 判断错误是否为扫描目录树时文件或目录状态发生变化（被删除、
 * 被替换为目录或被替换为非目录）时可能正常出现的错误。
 * 调用方应将这些错误视为"跳过此条目"而非致命错误。
 */
export function isExpectedSnapshotRaceError(error: unknown): boolean {
  if (!(error instanceof Error) || !("code" in error)) {
    return false;
  }
  return ["EISDIR", "ENOENT", "ENOTDIR"].includes(
    (error as NodeJS.ErrnoException).code ?? "",
  );
}
