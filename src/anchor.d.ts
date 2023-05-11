declare module "anchor-markdown-header" {
  /**
   * @param header      {String} The header to be anchored.
   * @param mode        {String} The anchor mode (github.com|nodejs.org|bitbucket.org|ghost.org|gitlab.com).
   * @param repetition  {Number} The nth occurrence of this header text, starting with 0. Not required for the 0th instance.
   * @param moduleName  {String} The name of the module of the given header (required only for 'nodejs.org' mode).
   * @return            {String} The header anchor that is compatible with the given mode.
   */
  function anchor(
    header: string,
    mode?:
      | "github.com"
      | "nodejs.org"
      | "bitbucket.org"
      | "ghost.org"
      | "gitlab.com",
    repetition?: number,
    moduleName?: string
  ): string;
  export = anchor;
}
