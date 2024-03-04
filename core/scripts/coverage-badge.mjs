// Import fs for file operations and badgeMaker to create the badge
import fs from "fs";
import pkg from "badge-maker";

const { makeBadge } = pkg;

// Function to generate SVG badge from coverage JSON
const generateCoverageBadge = async () => {
  // Read the JSON coverage summary
  const rawCoverage = fs.readFileSync("coverage/coverage-summary.json", "utf8");
  const coverageSummary = JSON.parse(rawCoverage);

  // Calculate total coverage percentage
  const linesCovered = coverageSummary.total.lines.covered;
  const totalLines = coverageSummary.total.lines.total;
  const coveragePercentage = Math.round((linesCovered / totalLines) * 100);

  // Define badge options
  const format = {
    label: "Core coverage",
    message: `${coveragePercentage}%`,
    color: coveragePercentage > 80 ? "green" : "red",
    style: "flat",
  };

  // Generate SVG badge
  const svg = makeBadge(format);

  // Save the SVG badge to a file
  fs.writeFileSync("coverage-badge.svg", svg);
  console.log("Coverage badge generated successfully!");
};

// Run the function to generate the badge
generateCoverageBadge().catch(console.error);
