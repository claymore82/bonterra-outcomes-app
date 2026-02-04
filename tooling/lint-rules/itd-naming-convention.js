// Custom markdownlint rule: ITD title must include parent directory as uppercase prefix
// e.g., file in "01-general/" should have title "# GENERAL-ITD-001: ..."

module.exports = {
  names: ["itd-naming-convention"],
  description: "ITD title must include parent directory as uppercase prefix (e.g., GENERAL-ITD-001)",
  tags: ["itd", "naming"],
  function: function rule(params, onError) {
    // Only apply to ITD files
    if (!params.name.match(/ITD-\d+/i)) {
      return;
    }

    // Extract parent directory from file path
    const pathParts = params.name.split("/");
    if (pathParts.length < 2) {
      return; // No parent directory to check
    }

    const parentDir = pathParts[pathParts.length - 2];
    
    // Extract category name from directory (remove leading numbers and dashes)
    // "01-general" -> "GENERAL", "02-process" -> "PROCESS"
    const categoryMatch = parentDir.match(/^\d*-?(.+)$/);
    if (!categoryMatch) {
      return;
    }
    
    const expectedPrefix = categoryMatch[1].toUpperCase().replace(/-/g, "_");

    // Find the first H1 heading
    let h1Content = null;
    let h1Line = null;
    
    for (let i = 0; i < params.tokens.length; i++) {
      const token = params.tokens[i];
      if (token.type === "heading_open" && token.tag === "h1") {
        const nextToken = params.tokens[i + 1];
        if (nextToken && nextToken.type === "inline") {
          h1Content = nextToken.content;
          h1Line = token.lineNumber;
          break;
        }
      }
    }

    if (!h1Content) {
      onError({
        lineNumber: 1,
        detail: "ITD file must have an H1 title",
        context: params.name
      });
      return;
    }

    // Check if title starts with expected prefix pattern
    // Expected: "CATEGORY-ITD-NNN:" or "CATEGORY_ITD-NNN:"
    const titlePattern = new RegExp(`^${expectedPrefix}[-_]ITD-\\d+:`, "i");
    
    if (!titlePattern.test(h1Content)) {
      onError({
        lineNumber: h1Line,
        detail: `ITD title should start with "${expectedPrefix}-ITD-NNN:" (found: "${h1Content.substring(0, 30)}...")`,
        context: params.name
      });
    }
  }
};


