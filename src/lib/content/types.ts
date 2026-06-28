export type ThemeName = "adn" | "dark" | "light" | "system";
export type PageAlign = "top" | "middle" | "bottom";

export type ThemeSemantic = {
  background: string;
  border: string;
  code: string;
  link: string;
  muted: string;
  subtle: string;
  text: string;
};

export type ThemeDefinition = {
  name: string;
  semantic: ThemeSemantic;
};

export type PageFrontmatter = {
  align: PageAlign;
  theme: ThemeName;
  font: string;
  fontsize: string;
};

export type GalleryDefinition = {
  items: string[];
};

export const DEFAULT_FRONTMATTER: PageFrontmatter = {
  align: "top",
  theme: "dark",
  font: "system",
  fontsize: "19px",
};
