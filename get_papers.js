
async function populate_lab_papers(scholar_ids, format) {

    const url = 'https://api.semanticscholar.org/graph/v1/author/batch';
    const papers_fields = ['title', 'year', 'paperId', 'venue', 'citationStyles', 'citationCount', 'authors', 'externalIds', 'url', 'publicationVenue', 'isOpenAccess', 'openAccessPdf'];
    const author_fields = ['name', 'citationCount', 'hIndex', 'paperCount'];
    const sep = 'papers.';
    const requestParam = "?fields=" + sep + papers_fields.join( "," + sep) + "," + author_fields.join(",");
    var requestURL = url + requestParam;
    const request = new Request(requestURL, {
        method: 'POST',
        headers: {
           'Accept': 'application/json',
           'Content-Type': 'application/json'
        },
        body: JSON.stringify({"ids":scholar_ids})
    });
    const response = await fetch(request);
    const papersText = await response.text();
    const papersjson = JSON.parse(papersText);
    const allPaperData = parseBatchPapers(papersjson);
    if (format == "list") {
      populateList(allPaperData);
    }
    else if (format == "table") {
      populateTable(allPaperData);
    }
    else if (format == "json") {
      return allPaperData;
    }
}

async function populate_papers(scholar_id_str, format) {

    const url = 'https://api.semanticscholar.org/graph/v1/author/';
    const papers_fields = ['title', 'year', 'paperId', 'venue', 'citationStyles', 'citationCount', 'authors', 'externalIds', 'url', 'publicationVenue', 'isOpenAccess', 'openAccessPdf'];
    const author_fields = ['name', 'citationCount', 'hIndex', 'paperCount'];
    const sep = 'papers.';
    const requestParam = "?fields=" + sep + papers_fields.join( "," + sep) + "," + author_fields.join(","); 
    var requestURL = url + scholar_id_str + requestParam;
    const request = new Request(requestURL);
    const response = await fetch(request);
    const papersText = await response.text();
    const papersjson = JSON.parse(papersText);
    jsonPaperList = paperListToJSON(papersjson);
    if (format == "list") {
      populateList(jsonPaperList);
    }
    else if (format == "table") {
      populateTable(jsonPaperList);
    }
    else if (format == "json") {
      return jsonPaperList;
    }
}

function get_shortest_str(arr) {
    if (arr == null || arr.length ==0)
      return "";
    
    return arr.reduce(function(a, b) { 
        return a.length <= b.length ? a : b
    });
}

function abbreviated_venue(v, v_detailed) {
    if(v_detailed == null)
        return "Preprint";
    return get_shortest_str(v_detailed.alternate_names) || v ;
}
  
function author_list(authors, highlighted_author) {
    return authors.map(x => x.name == highlighted_author? "<b>" + x.name + "</b>": x.name).join(', ');
}

function raw_author_list(authors) {
    return authors.map(x => x.name).join(', ');
}

function copyBib(bib, bib_id){
    console.log(`Copying ${bib} to ${bib_id}`);
    navigator.clipboard.writeText(bib);
    document.getElementById(bib_id).textContent = "copied!";
}

function reportError(paper_id, author_id, paper_title) {
    alert("You will be redirected to an error reporting form.");
    base_url = 'https://nikett-paperlist-app-dazi7u.streamlit.app/'
    redirect_url = base_url + '?paper_id='+paper_id+'&author_id='+author_id+'&paper_title='+paper_title;
    location.href = redirect_url;
}

function parseAuthorMetadata(obj) {
    var data = {};

    data["author_name"] = obj.name;
    data["author_id"] = obj.authorId;
    data["paper_count"] = obj.paperCount;
    data["citation_count"] = obj.citationCount;
    data["h_index"] = obj.hIndex;

    return data;
}

function parsePaperList(obj) {
    const papers = obj.papers;
    const highlighted_author = obj.name;

    var paperList = [];

    for (const p of papers) {
      var paperData = {};
      paperData["paper_title"] = p.title;
      paperData["paper_id"] = p.paperId;
      paperData["author_list"] = raw_author_list(p.authors);
      paperData["highlighted_author_list"] = author_list(p.authors, highlighted_author);
      paperData["num_citations"] = p.citationCount;
      paperData["venue"] = p.venue;
      paperData["publicationVenue"] = p.publicationVenue;
      paperData["abbreviated_venue"] = abbreviated_venue(p.venue, p.publicationVenue);
      paperData["year"] = p.year;
      paperData["bib"] = p.citationStyles.bibtex.replace("@None", "@article");
      if (p.isOpenAccess) {
        paperData["pdf_url"] = p.openAccessPdf.url;
      }
      else {
        paperData["pdf_url"] = p.url;
      }

      paperList.push(paperData);
    }
    return paperList;
}

function paperListToJSON(obj) {

    var data = {};
    data["author_meta"] = parseAuthorMetadata(obj);
    data["json_paper_list"] = parsePaperList(obj);

    return data;
}

function parseBatchPapers(obj) {
    var labAuthorsMeta = [];
    var labPapers = [];
    for (const authorData of obj) {
        authorMeta = parseAuthorMetadata(authorData);
        labAuthorsMeta.push(authorMeta);

        authorPapers = parsePaperList(authorData);
        labPapers.push.apply(labPapers, authorPapers);
    }
    var data = {};
    data["authors"] = labAuthorsMeta;
    data["json_paper_list"] = labPapers;

    return data;
}

function populateTable(author_data) {
    const section = document.querySelector('papers_list');
  
    const tbl = document.createElement('table');
    var t = "" ; // table content.

    author = author_data["author_meta"]["author_id"]
    papers = author_data["json_paper_list"]
    
    pnum = 1;
    for (const p of papers) {
      paper_title = p["paper_title"]
      t += "<tr>";
      t += "<td> "+p["paper_title"]+"<br>";
      t += p["highlighted_author_list"]+"<br>"
      t += p["abbreviated_venue"]+", "+p["year"];
      t += ` <a href="${p["pdf_url"]}">[PDF]</a>`;
      bib = p["bib"];
      bib_id  = `bibtocopy${pnum}`;
      t += '<button id="' + bib_id + '" onclick="copyBib(`' + bib +'`, `' + bib_id + '`)">Copy bib</button>';
      paper_id = p["paper_id"];
      t += '<button id="' + paper_id + '" onclick="reportError(`' + paper_id +'`, `' + author_id + '`, `' + paper_title + '`)">Report</button>';
      t += " <br><br></td>";
      t += "</tr>";
      pnum += 1;
    }

    tbl.innerHTML = t;
    section.appendChild(tbl);
}

function populateList(author_data) {
    const section = document.querySelector('papers_list');
  
    const ul = document.createElement('ul');
    var t = "" ; // list content.

    author_id = author_data["author_meta"]["author_id"]
    papers = author_data["json_paper_list"]
    
    pnum = 1;
    for (const p of papers) {
      paper_title = p["paper_title"]
      let item = document.createElement("li");
      li = ""
      li += p["paper_title"]+"<br>"
      li += p["highlighted_author_list"]+"<br>"
      li += p["abbreviated_venue"]+", "+p["year"];
      li += ` <a href="${p["pdf_url"]}">[PDF]</a>`;
      bib = p["bib"];
      bib_id  = `bibtocopy${pnum}`;
      li += '<button id="' + bib_id + '" onclick="copyBib(`' + bib +'`, `' + bib_id + '`)">Copy bib</button>';
      paper_id = p["paper_id"];
      li += '<button id="' + paper_id + '" onclick="reportError(`' + paper_id +'`, `' + author_id + '`, `' + paper_title + '`)">Report</button>';
      li += " <br><br>";
      item.innerHTML = li;
      pnum += 1;
      ul.appendChild(item)
    }

    section.appendChild(ul);
}
