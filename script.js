

const map = {
    "Problem Strength": 1.5,
    "Passion": 2,
    "Funding chance": 1,
    "Why us": 1.5,
    "Why now": 1,
    "Ease of hiring close friends": 1,
    "Business model": 1,
    "How feasible does the MVP look like": 1,
    "Ease of validation": 1.25,
    "Solution is clear": 1,
    "Competition score": 1.5,
    "Potential buyers": 0.5
}

const total = Object.values(map).reduce((a, c) => a + c, 0);

const s = [];
const g = [];
for (const k in map) {
    const mod = map[k];
    s.push(`(prop("S. ${k}") * ${mod})`);
    g.push(`(prop("G. ${k}") * ${mod})`);
}

const formula = (parts) => `round(((${parts.join('+')}) / ${total}) * 100) / 100`

const sFormula = formula(s);
const gFormula = formula(g);


console.log('SHIMI:');
console.log(sFormula);
console.log('\n\nGABI:');
console.log(gFormula);




if(larger(prop("G. Total"), prop("S. Total")), concat(format(abs(prop("G. Total") - prop("S. Total"))), ", Gabi likes more"), concat(format(abs(prop("S. Total") - prop("G. Total"))), ", Shimi likes more"))
