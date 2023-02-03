# paperlist

This JS script uses the Semantic Scholar API to query the publication list of an author using their Semantic Scholar ID and offers multiple options to academics and labs to incorporate them into their websites.

## Usage

Please add the following line of code inside the head tag of your website.

```
<script src="https://niket.tandon.info/assets/papers/get_papers.js" type="text/javascript">
```

### Populating a List

Add the following snippet inside the body tag of the website, at the point where you want to display publications as an unitemized list. This also provides a button which, on clicking, copies the bib entry on the clipboard and can be used directly. `#1234567` corresponds to the Semantic Scholar ID of the person whose publication list is to be displayed.

```
<papers_header> </papers_header>
<papers_list> </papers_list>
<script> populate("#123467", "list"); </script>
```

### Populating a Table

Add the following snippet inside the body tag of the website, at the point where you want to display publications as a table. This also provides a button which, on clicking, copies the bib entry on the clipboard and can be used directly. `#1234567` corresponds to the Semantic Scholar ID of the person whose publication list is to be displayed.

```
<papers_header> </papers_header>
<papers_list> </papers_list>
<script> populate("#123467", "table"); </script>
```

### Using a JSON object

Add the following line of code inside the body tag of the website where you want to fetch the requisite data. This returns a JSON object with all the data related to the author and their publication list. `#1234567` corresponds to the Semantic Scholar ID of the person whose publication list is to be displayed.

```
<script> data = populate_papers("#123467", "json");
```

### JSON object

Below is an example JSON object that is returned.

```
{
	"author_meta": {
		"citation_count": int,
		"h_index": int,
		"paper_count": int
	},
	"json_paper_list": [ {
			"paper_title": str,
			"author_list": str,
			"highlighted_author_list": str,
			"bib": str,
			"citation_count": int,
			"publicationVenue": str,
			"venue": str,
			"abbreviated_venue": str,
			"year": int
		},
	]
}
```