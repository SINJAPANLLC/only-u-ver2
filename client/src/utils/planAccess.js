// プランベースのアクセス制御ユーティリティ

// プランレベルの階層定義
export const PLAN_LEVELS = {
  basic: 1,
  premium: 2,
  vip: 3
};

/**
 * プランベースのアクセス制御チェック
 * @param {string|null} userPlanLevel - ユーザーのサブスクリプションプランレベル
 * @param {string|null} requiredPlanLevel - コンテンツが必要とするプランレベル
 * @param {boolean} isOwner - コンテンツの所有者かどうか
 * @param {boolean} isAdmin - 管理者かどうか
 * @returns {boolean} - アクセス可能かどうか
 */
export const canAccessContent = (userPlanLevel, requiredPlanLevel, isOwner, isAdmin) => {
  // オーナーまたは管理者は常にアクセス可能
  if (isOwner || isAdmin) return true;
  
  // 必要プランレベルが指定されていない場合はアクセス可能
  if (!requiredPlanLevel) return true;
  
  // ユーザーのプランレベルがない場合はアクセス不可
  if (!userPlanLevel) return false;
  
  // プランレベルの階層チェック（higher level can access lower level content）
  return PLAN_LEVELS[userPlanLevel] >= PLAN_LEVELS[requiredPlanLevel];
};

/**
 * プランレベルのラベルを取得
 * @param {string} planLevel - プランレベル
 * @returns {string} - 日本語のラベル
 */
export const getPlanLabel = (planLevel) => {
  const labels = {
    basic: 'ベーシック',
    premium: 'プレミアム',
    vip: 'VIP'
  };
  return labels[planLevel] || '不明';
};

/**
 * プランレベルの限定ラベルを取得
 * @param {string} planLevel - プランレベル
 * @returns {string} - 日本語の限定ラベル
 */
export const getExclusiveLabel = (planLevel) => {
  const labels = {
    basic: '限定',
    premium: 'プレミアム限定',
    vip: 'VIP限定'
  };
  return labels[planLevel] || '限定';
};
