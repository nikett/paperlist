
async function populate_lab_papers(scholar_ids, format="list", exclude_paper_ids=[], report_mode=false) {

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
    const allPaperData = parseBatchPapers(papersjson, exclude_paper_ids);
    // turn off highlighting author names for lab (current design decision)
    if (format == "list") {
      populateList(allPaperData, report_mode, false);
    }
    else if (format == "table") {
      populateTable(allPaperData, report_mode, false);
    }
    else if (format == "json") {
      return allPaperData;
    }
}

async function populate_papers(scholar_id_str, format="list", exclude_paper_ids=[], report_mode=false) {

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
    jsonPaperList = paperListToJSON(papersjson, exclude_paper_ids);
    if (format == "list") {
      populateList(jsonPaperList, report_mode, true);
    }
    else if (format == "table") {
      populateTable(jsonPaperList, report_mode, true);
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
    document.getElementById(bib_id).textContent = "Copied!";
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

function parsePaperList(obj, exclude_paper_ids) {
    const papers = obj.papers;
    const highlighted_author = obj.name;

    var paperList = [];

    for (const p of papers) {
      var paperData = {};
      if (exclude_paper_ids.includes(p.paperId) == false) {
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
    }
    return paperList;
}

function paperListToJSON(obj, exclude_paper_ids) {

    var data = {};
    data["author_meta"] = parseAuthorMetadata(obj);
    data["json_paper_list"] = parsePaperList(obj, exclude_paper_ids);

    return data;
}

function deduplicateLabPapers(papers) {
    var dedupLabPapers = [];
    var paperIds = {};
    for (var i=0; i < papers.length; i++) {
        if (papers[i]["paper_id"] in paperIds) {
            continue;
        }
        else {
            paperIds[papers[i]["paper_id"]] = 1;
            dedupLabPapers.push(papers[i]);
        }
    }
    return dedupLabPapers;
}

function parseBatchPapers(obj, exclude_paper_ids) {
    var labAuthorsMeta = [];
    var labPapers = [];
    for (const authorData of obj) {
        authorMeta = parseAuthorMetadata(authorData);
        labAuthorsMeta.push(authorMeta);

        authorPapers = parsePaperList(authorData, exclude_paper_ids);
        labPapers.push.apply(labPapers, authorPapers);
    }
    var data = {};
    data["authors"] = labAuthorsMeta;
    dedupLabPapers = deduplicateLabPapers(labPapers);
    data["json_paper_list"] = dedupLabPapers;

    return data;
}

function createTableRow(p, report_mode, highlight) {
    paper_title = p["paper_title"]
    t = "";
    t += `<tr class="tableRow">`;

    t += "<td>"+p["paper_title"]+".<br>";
    if (highlight == true) {
        t += p["highlighted_author_list"] + "<br>";
    }
    else {
        t += p["author_list"] + "<br>";
    }
    ven = p["abbreviated_venue"];
    t += "<i>" + ven + " " + p["year"] + " </i><br>";
    t += ` <a href="${p["pdf_url"]}"><span class="tableBtn">[PDF]</span></a>`;
    bib = p["bib"];
    bib_id  = `bibtocopy${pnum}`;
    t += '<button id="' + bib_id + '" class="tableBtn" onclick="copyBib(`' + bib +'`, `' + bib_id + '`)">Cite</button>'
    if (report_mode == true) {
        paper_id = p["paper_id"];
        t += '<button id="' + paper_id + '" class="tableBtn" onclick="reportError(`' + paper_id +'`, `' + author_id + '`, `' + paper_title + '`)">Report</button>';
    }
    t += " <br><br></td>";
    t += "</tr>";
    return t;
}

function populateTable(author_data, report_mode, highlight) {
    const section = document.querySelector('papers_list');
  
    const tbl = document.createElement('table');
    var t = "" ; // table content.

    papers = author_data["json_paper_list"]
    
    pnum = 1;
    for (const p of papers) {
      tr_item = createTableRow(p, report_mode, highlight);
      t += tr_item;
      pnum += 1;
    }

    tbl.innerHTML = t;
    section.appendChild(tbl);
}

function createListItem(p, report_mode, highlight) {
    paper_title = p["paper_title"];
    li = ""
    li += p["paper_title"]+".<br>"
    // console.log(highlight);
    if (highlight == true) {
        li += p["highlighted_author_list"] + "<br>";
    }
    else {
        li += p["author_list"] + "<br>";
    }
    ven = p["abbreviated_venue"];
    li += "<i>" + ven + " " + p["year"] + " </i><br>";
    li += ` <a href="${p["pdf_url"]}"><span class="listBtn">PDF</span></a>`;
    bib = p["bib"];
    bib_id  = `bibtocopy${pnum}`;
    li += '<button id="' + bib_id + '" class="listBtn" onclick="copyBib(`' + bib +'`, `' + bib_id + '`)">Cite</button>';
    if (report_mode == true) {
        paper_id = p["paper_id"];
        li += '<button id="' + paper_id + '" class="listBtn" onclick="reportError(`' + paper_id +'`, `' + author_id + '`, `' + paper_title + '`)">Report</button>';
    }
    li += " <br><br>";
    return li;
}

function populateList(author_data, report_mode, highlight) {
    const section = document.querySelector('papers_list');
  
    const ul = document.createElement('ul');
    var t = "" ; // list content.

    papers = author_data["json_paper_list"]
    
    pnum = 1;
    for (const p of papers) {
      let item = document.createElement("li");
      li = createListItem(p, report_mode, highlight);
      item.innerHTML = li;
      item.className = "sampleblock";
      pnum += 1;
      ul.appendChild(item)
    }

    section.appendChild(ul);
}
