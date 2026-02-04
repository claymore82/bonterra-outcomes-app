// Custom markdownlint rule: ITDs should only have valid sections
// Valid sections: CONTEXT, PROBLEM, OPTIONS CONSIDERED, REASONING, IMPLICATIONS
// Optional: Implementation (Notes)

module.exports = {
  names: ["itd-valid-sections"],
  description: "ITD documents should only contain valid sections",
  tags: ["itd", "structure"],
  function: function rule(params, onError) {
    // Only apply to ITD files
    if (!params.name.match(/ITD-\d+/i) && !params.name.includes("ITD-")) {
      return;
    }

    // Valid H2 sections (case-insensitive patterns)
    const validSections = [
      /^context$/i,
      /^problem$/i,
      /^options?\s*(considered)?$/i,
      /^reasoning$/i,
      /^implications?$/i,
      /^implementation\s*(notes)?$/i,  // Optional section
    ];

    // Get all H2 headings
    params.tokens.forEach((token, index) => {
      if (token.type === "heading_open" && token.tag === "h2") {
        const nextToken = params.tokens[index + 1];
        if (nextToken && nextToken.type === "inline") {
          const headingText = nextToken.content.trim();
          
          // Check if this heading matches any valid section
          const isValid = validSections.some(pattern => pattern.test(headingText));
          
          if (!isValid) {
            onError({
              lineNumber: token.lineNumber,
              detail: `Invalid ITD section: "${headingText}"`,
              context: `Valid sections: CONTEXT, PROBLEM, OPTIONS CONSIDERED, REASONING, IMPLICATIONS, Implementation (optional)`
            });
          }
        }
      }
    });
  }
};

