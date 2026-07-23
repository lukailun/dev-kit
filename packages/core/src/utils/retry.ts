/**
 * 重试行为类型
 */
export type RepeatBehavior =
  | { type: 'immediate'; maxCount: number }
  | { type: 'delayed'; maxCount: number; seconds: number }
  | { type: 'exponentialDelayed'; maxCount: number; initialSeconds: number; multiplier: number }; // multiplier：延迟递增倍数（如 1 表示每次翻倍）

/**
 * 计算当前轮次对应的最大尝试次数与延迟毫秒数
 */
function calculateConditions(
  behavior: RepeatBehavior,
  currentRepetition: number
): { maxCount: number; delayMs: number } {
  switch (behavior.type) {
    case 'immediate':
      return { maxCount: behavior.maxCount, delayMs: 0 };
    case 'delayed':
      return { maxCount: behavior.maxCount, delayMs: behavior.seconds * 1000 };
    case 'exponentialDelayed': {
      const delay =
        currentRepetition === 1
          ? behavior.initialSeconds
          : behavior.initialSeconds * Math.pow(1 + behavior.multiplier, currentRepetition - 1);
      return { maxCount: behavior.maxCount, delayMs: delay * 1000 };
    }
  }
}

/**
 * 重试配置选项
 */
interface RetryOptions<T> {
  behavior: RepeatBehavior,
  /** 成功结果重试谓词：返回 true 则触发重试，默认成功不重试 */
  shouldRetryWhenSuccess?: (value: T) => boolean;
  /** 错误重试谓词：返回 true 则触发重试，默认所有错误都重试 */
  shouldRetryWhenError?: (error: unknown) => boolean;
  /** 重试耗尽后的默认返回值，设置后不再抛出错误 */
  defaultValue?: T;
}

/**
 * 核心重试函数
 * @param task 异步任务工厂函数，每次重试都会重新执行
 * @param options 重试配置选项
 */
export function retry<T>(
  task: () => Promise<T>,
  options: RetryOptions<T> = { behavior: {type: 'immediate', maxCount: 2}}
): Promise<T> {
  const { shouldRetryWhenSuccess, shouldRetryWhenError } = options;
  async function attempt(currentAttempt: number): Promise<T> {
    if (currentAttempt <= 0) {
      return new Promise(() => {});
    }
    const conditions = calculateConditions(options.behavior, currentAttempt);
    return task()
      .then((value) => {
        const successPredicate = shouldRetryWhenSuccess ?? (() => false); 
        if (successPredicate(value)) {
          if (currentAttempt >= conditions.maxCount) { 
            return value;
          } 
          if (conditions.delayMs <= 0) {
            return attempt(currentAttempt + 1);
          }
          return new Promise<void>((resolve) => setTimeout(resolve, conditions.delayMs)).then(
            () => attempt(currentAttempt + 1)
          );
        } 
        return value;
      })
      .catch(async (error: unknown) => { 
        if (currentAttempt >= conditions.maxCount) { 
          if (options.defaultValue !== undefined) {
            return options.defaultValue;
          }
          throw error;
        }
        const errorPredicate = shouldRetryWhenError ?? (() => true); 
        if (!errorPredicate(error)) {
          throw error;
        } 
        if (conditions.delayMs <= 0) {
          return attempt(currentAttempt + 1);
        } 
        return new Promise<void>((resolve) => setTimeout(resolve, conditions.delayMs)).then(
          () => attempt(currentAttempt + 1)
        );
      });
  }
  return attempt(1);
}