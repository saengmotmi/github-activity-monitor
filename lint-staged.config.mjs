/**
 * lint-staged 구성 파일
 * @see https://github.com/okonet/lint-staged
 * @type {import('lint-staged').Config}
 */
export default {
  "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"],
};
