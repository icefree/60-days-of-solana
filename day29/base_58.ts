/**
 * 手动实现 Base58 解码逻辑（TypeScript 版）
 * 对应 day29/base_58.py 的逻辑
 */

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/**
 * 将 Base58 字符串解码为指定长度的 Uint8Array
 * @param bc Base58 编码的字符串
 * @param length 期望的字节长度
 * @throws Error 如果数值超出指定长度（模拟 Python 的 OverflowError）
 */
function decodeBase58(bc: string, length: number): Uint8Array {
  let n = 0n;
  for (const char of bc) {
    const index = BASE58_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid Base58 character: ${char}`);
    }
    n = n * 58n + BigInt(index);
  }

  // 检查是否溢出 (2^(8 * length))
  const maxValue = 1n << BigInt(8 * length);
  if (n >= maxValue) {
    throw new Error("OverflowError");
  }

  const result = new Uint8Array(length);
  for (let i = length - 1; i >= 0; i--) {
    result[i] = Number(n % 256n);
    n = n / 256n;
  }
  
  return result;
}

/**
 * 尝试用不同的长度解码，模拟 Python 中的 find_correct_length_for_decoding
 * @param base58String Base58 字符串
 */
function findCorrectLengthForDecoding(base58String: string): string | null {
  // 遍历长度 25 到 50
  for (let length = 25; length < 50; length++) {
    try {
      const decodedBytes = decodeBase58(base58String, length);
      // 转换为十六进制字符串
      return Array.from(decodedBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (e) {
      if ((e as Error).message === "OverflowError") {
        continue;
      }
      throw e;
    }
  }
  return null;
}

// 要转换的 Base58 字符串
const base58_string = "D9FbrJD6gSoanhzcXmH8UvWXU3QnfSe8P1WViRKCQmwX";

// 转换并检查十六进制字符串
const hex_string = findCorrectLengthForDecoding(base58_string);
console.log(hex_string);

// 预期输出: b469661a0e82243529db2f080306c4edfa087d04c42fff237fee720d37d78f92
