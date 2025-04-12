/**
 * lint-staged 구성 파일
 * @see https://github.com/okonet/lint-staged
 * @type {import('lint-staged').Config}
 */
export default {
  "*.{json,md,yml,yaml}": ["prettier --write --config dev-configs/prettier.config.mjs"],
};
