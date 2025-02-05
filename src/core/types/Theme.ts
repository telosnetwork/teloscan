export interface Themes {
  light: Theme;
  dark: Theme;
}

export interface Theme {
  [key: string]: string;
}

export interface SocialLink {
  name: string;
  url: string;
  icon: string;
  classSuffix: string;
}

export interface FooterLink {
  label: string;
  url: string;
}

export interface FooterLinksColumn {
  title: string;
  links: FooterLink[];
}

export interface FooterBranding {
  title: string;
  logoLight: string;
  logoDark: string;
  url: string;
}

export interface FooterLinksConfig {
  chain: string;
  branding: FooterBranding;
  columns: FooterLinksColumn[];
}

export interface HeaderMenuEntry {
  label: string;
  trigger?: string;
  internalLink?: string;
  externalLink?: string;
  entries?: HeaderMenuEntry[];
  rightIcon?: string;
  leftIcon?: string;
}

export interface HeaderMenuConfig {
  chain: string;
  entries: HeaderMenuEntry[];
}

export interface BrandingType {
  text: string,
  icon: string,
  tab: string,
}

