// Custom markdownlint rule: Data Structure docs must have required sections
// Applies to files matching DS-*.md pattern

module.exports = {
  names: ["ds-required-sections"],
  description: "Data Structure documents must have required sections",
  tags: ["ds", "structure"],
  function: function rule(params, onError) {
    // Only apply to DS files
    if (!params.name.match(/DS-\d+/i)) {
      return;
    }

    // Get all headings from the document
    const headings = [];
    params.tokens.forEach((token, index) => {
      if (token.type === "heading_open") {
        const nextToken = params.tokens[index + 1];
        if (nextToken && nextToken.type === "inline") {
          headings.push({
            level: parseInt(token.tag.replace("h", ""), 10),
            text: nextToken.content.toLowerCase(),
            line: token.lineNumber
          });
        }
      }
    });

    // Required sections for Data Structures (case-insensitive matching)
    const requiredSections = [
      { pattern: /overview/i, name: "Overview" }
    ];

    // Check for missing sections
    const missingSections = [];
    for (const section of requiredSections) {
      const found = headings.some(h => section.pattern.test(h.text));
      if (!found) {
        missingSections.push(section.name);
      }
    }

    if (missingSections.length > 0) {
      onError({
        lineNumber: 1,
        detail: `Missing required DS section(s): ${missingSections.join(", ")}`,
        context: params.name
      });
    }
  }
};

