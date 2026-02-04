// Custom markdownlint rule: ITDs must have required sections
// Applies to files matching *ITD*.md pattern

module.exports = {
  names: ["itd-required-sections"],
  description: "ITD documents must have required sections",
  tags: ["itd", "structure"],
  function: function rule(params, onError) {
    // Only apply to ITD files
    if (!params.name.match(/ITD-\d+/i) && !params.name.includes("ITD-")) {
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

    // Required sections for ITDs (case-insensitive matching)
    const requiredSections = [
      { pattern: /context/i, name: "Context" },
      { pattern: /problem/i, name: "Problem" },
      { pattern: /options?\s*(considered)?/i, name: "Options Considered" },
      { pattern: /reasoning/i, name: "Reasoning" },
      { pattern: /implications?/i, name: "Implications" }
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
        detail: `Missing required ITD section(s): ${missingSections.join(", ")}`,
        context: params.name
      });
    }
  }
};

