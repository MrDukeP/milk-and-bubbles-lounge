export const SITE_ASSET_TYPES = [
  "hero_image",
  "hero_polaroid",
  "background_texture",
  "decorative_asset",
  "overlay",
  "grain_layer",
  "floating_object",
  "future_asset",
] as const;

export type SiteAssetType = (typeof SITE_ASSET_TYPES)[number];

export function isSiteAssetType(value: string): value is SiteAssetType {
  return SITE_ASSET_TYPES.includes(value as SiteAssetType);
}

export function siteAssetTypeLabel(type: string) {
  return type.replaceAll("_", " ");
}

export function siteAssetsByType<T extends { assetType: string }>(assets: T[], assetType: SiteAssetType) {
  return assets.filter((asset) => asset.assetType === assetType);
}

export function firstSiteAssetOfType<T extends { assetType: string }>(assets: T[], assetType: SiteAssetType) {
  return siteAssetsByType(assets, assetType)[0];
}
