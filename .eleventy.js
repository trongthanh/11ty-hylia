const rssPlugin = require('@11ty/eleventy-plugin-rss');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const fs = require('fs');

// Import filters
const dateFilter = require('./_11ty/filters/date-filter.js');
const markdownFilter = require('./_11ty/filters/markdown-filter.js');
const w3DateFilter = require('./_11ty/filters/w3-date-filter.js');

// Import transforms
const htmlMinTransform = require('./_11ty/transforms/html-min-transform.js');
const parseTransform = require('./_11ty/transforms/parse-transform.js');

// Import data files
const site = require('./_data/site.json');

module.exports = function(config) {
	// Filters
	config.addFilter('dateFilter', dateFilter);
	config.addFilter('markdownFilter', markdownFilter);
	config.addFilter('w3DateFilter', w3DateFilter);

	// Layout aliases
	config.addLayoutAlias('home', 'layouts/home.njk');

	// Transforms
	config.addTransform('htmlmin', htmlMinTransform);
	config.addTransform('parse', parseTransform);

	// Passthrough copy
	config.addPassthroughCopy('./fonts');
	config.addPassthroughCopy('./images');
	config.addPassthroughCopy('./js');
	config.addPassthroughCopy('node_modules/nunjucks/browser/nunjucks-slim.js');
	config.addPassthroughCopy('./robots.txt');

	const now = new Date();

	// Custom collections
	const livePosts = (post) => post.date <= now && !post.data.draft;
	config.addCollection('posts', (collection) => {
		return [...collection.getFilteredByGlob('./posts/**/*.md').filter(livePosts)].reverse();
	});

	config.addCollection('postFeed', (collection) => {
		return [...collection.getFilteredByGlob('./posts/**/*.md').filter(livePosts)]
			.reverse()
			.slice(0, site.maxPostsPerPage);
	});

	// Plugins
	config.addPlugin(rssPlugin);
	config.addPlugin(syntaxHighlight);

	// 404
	config.setBrowserSyncConfig({
		callbacks: {
			ready: function(err, browserSync) {
				const content_404 = fs.readFileSync('_site/404.html');

				browserSync.addMiddleware('*', (req, res) => {
					// Provides the 404 content without redirect.
					res.write(content_404);
					res.end();
				});
			},
		},
	});

	return {
		dir: {
			input: '.',
			output: '_site',
		},
		passthroughFileCopy: true,
	};
};
