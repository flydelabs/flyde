module.exports = function (w) {

	return {
	  files: [
		'src/**/*.ts',
		'src/**/*.tsx',
		{pattern: 'src/**/spec.ts', ignore: true},
		{pattern: 'src/**/spec.tsx', ignore: true}
	  ],
  
	  tests: [
		'src/**/spec.ts',
		'src/**/spec.tsx',
	  ],
	  env: {
		type: 'node'
	  }
	};
  };