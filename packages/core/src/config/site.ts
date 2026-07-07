const repoUrl = "https://github.com/metesahankurt/nolio";
const siteUrl = repoUrl;
const apiUrl = "https://api.github.com/repos/metesahankurt/nolio";

export const siteConfig = {
  name: "Nolio",
  owner: "metesahankurt",
  headline: "Encrypted Notes That Stay on Your Device",
  description:
    "A local-first notes app with an encrypted vault, rich text editing, backups, and native desktop builds.",
  links: {
    website: siteUrl,
    github: repoUrl,
    issues: `${repoUrl}/issues`,
    discussions: `${repoUrl}/discussions`,
    releases: `${repoUrl}/releases/latest`,
    license: `${repoUrl}/blob/master/LICENSE`,
    changelog: `${repoUrl}/blob/master/CHANGELOG.md`,
    contributing: `${repoUrl}/blob/master/CONTRIBUTING.md`,
    githubApi: `${apiUrl}/releases?per_page=10`,
  },
};

export type SiteConfig = typeof siteConfig;
