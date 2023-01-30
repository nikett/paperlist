
async function populate_papers(scholar_id_str) {

    const url = 'https://api.semanticscholar.org/graph/v1/author/';
    const papers_fields = ['title', 'year', 'venue', 'citationStyles', 'citationCount', 'authors', 'externalIds', 'url', 'publicationVenue', 'isOpenAccess', 'openAccessPdf'];
    const author_fields = ['name', 'citationCount', 'hIndex', 'paperCount'];
    const sep = 'papers.';
    const requestParam = "?fields=" + sep + papers_fields.join( "," + sep) + "," + author_fields.join(","); 
    var requestURL = url + scholar_id_str + requestParam;
    const request = new Request(requestURL);
    const response = await fetch(request);
    const papersText = await response.text();
    const papersjson = JSON.parse(papersText);
    populateHeader(papersjson);
    populateList(papersjson);
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
      return v;
    return get_shortest_str(v_detailed.alternate_names) || v ;
  }
  
  function author_list(authors, highlighted_author) {
    return authors.map(x => x.name == highlighted_author? "<b>" + x.name + "</b>": x.name).join(', ');
  }

  function copyBib(bib, bib_id){
    console.log(`Copying ${bib} to ${bib_id}`);
    navigator.clipboard.writeText(bib);
    document.getElementById(bib_id).textContent = "copied!";
  }

  function populateList(obj) {
    const section = document.querySelector('papers_list');
    const papers = obj.papers;
    const highlighted_author = obj.name;
  
    const tbl = document.createElement('table');
    var t = "" ; // table content.
    
    pnum = 1;
    for (const p of papers) {
      t += "<tr>";
      t += `<td> ${p.title}<br>`;
      t += `${author_list(p.authors, highlighted_author)}<br>`;
      t += `${abbreviated_venue(p.venue, p.publicationVenue)} ${p.year}`;
      t += ` <a href="${p.isOpenAccess? p.openAccessPdf.url: p.url}">pdf</a>`;
      if (p.citationCount > 0)
        t += `  (${p.citationCount} citations)  `;
      bib = p.citationStyles.bibtex.replace("@None", "@article");
      bib_id  = `bibtocopy${pnum}`;
      t += '<button id="' + bib_id + '" onclick="copyBib(`' + bib +'`, `' + bib_id + '`)">copy bib</button>';
      t += " <br><br></td>";
      t += "</tr>";
      pnum += 1;
    }

    tbl.innerHTML = t;
    section.appendChild(tbl);
  }


  function populateHeader(obj) {
    const header = document.querySelector('papers_header');
    const myH1 = document.createElement('h3');
    myH1.textContent = `${obj.paperCount} papers | ${obj.citationCount} citations | h-index: ${obj.hIndex}`;
    header.appendChild(myH1);
  
  }