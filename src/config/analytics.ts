// Analytics configuration
// Set these via GitHub Actions Secrets or env vars (Next.js 14 support env in config)

export const ANALYTICS = {
  // JSONBin.io — 免费 JSON 存储（每个 bin 25MB）
  // 获取方式：https://www.jsonbin.io
  // 1. 注册 → 新建 bin → 复制 API Key
  // 2. bin 设为 Public（read），Write 用 API Key
  // 3. bin id 会自动生成
  JSONBIN_ID: (process.env.NEXT_PUBLIC_ANALYTICS_BIN_ID as string) || '',
  
  // 每页面加载时发送匿名访问记录
  // ip-api.com 免费额度：45 req/min
  GEO_API: 'https://ip-api.com/json/?fields=status,continent,continentCode,country,countryCode,regionName,city,zip,lat,lon,query',
  
  // 访问记录保留天数
  RETENTION_DAYS: 90,
} as const
