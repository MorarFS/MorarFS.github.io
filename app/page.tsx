const faculty = 'https://fass.nus.edu.sg/hist/people/florin-stefan-morar/';
export default function Home() {
  return <>
    <a className="skip-link" href="#about">Skip to content</a>
    <header className="site-header">
      <a className="wordmark" href="#">Florin-Stefan Morar<span>Historian</span></a>
      <nav aria-label="Main navigation"><a href="#about">About</a><a href="#research">Research</a><a href="mailto:morar@nus.edu.sg">Contact ↗</a></nav>
    </header>
    <main className="page-grid">
      <aside className="profile" aria-label="Academic profile">
        <img className="portrait" src="/portrait.jpg" alt="Florin-Stefan Morar" width="1000" height="668" fetchPriority="high" />
        <div className="profile-meta">
          <p>Assistant Professor of History</p><p>Director, History+AI Lab</p>
          <p className="affiliation">National University<br />of Singapore</p>
          <div className="profile-links">
            <a href={faculty}>NUS faculty profile <span aria-hidden="true">↗</span></a>
            <a href="mailto:morar@nus.edu.sg">morar@nus.edu.sg <span aria-hidden="true">↗</span></a>
            <a href="https://github.com/MorarFS">GitHub <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </aside>
      <div className="content">
        <section id="about" aria-labelledby="about-heading">
          <p className="eyebrow">History · Knowledge · Computation</p>
          <h1 id="about-heading">Florin-Stefan<br />Morar<span className="full-stop">.</span></h1>
          <p className="lead">I study how knowledge travels across cultures and changes through technology.</p>
          <p>My work connects global history, the history of science, and computational humanities. At the National University of Singapore, I direct the History+AI Lab. I explore how computational methods can deepen historical interpretation, research, and teaching.</p>
          <p>I received my PhD in the History of Science from Harvard University in 2019.</p>
        </section>
        <section className="research" id="research" aria-labelledby="research-heading">
          <div className="section-heading"><span className="eyebrow">Selected work</span><h2 id="research-heading">Research</h2></div>
          <article className="project"><span className="project-number" aria-hidden="true">01</span><div><h3>Science and Emotions</h3><p>Exploring the emotional dimensions of scientific life through historical research and computational humanities.</p></div></article>
          <article className="project"><span className="project-number" aria-hidden="true">02</span><div><h3>The Pulse of History</h3><p>Investigating how historical scholarship changes over time through computational analysis and historical interpretation.</p></div></article>
          <article className="project book"><span className="project-number" aria-hidden="true">03</span><div><p className="eyebrow">Book · Cambridge University Press</p><h3>Connected Cartographies</h3><p className="book-subtitle">World Geography and the Sino-Western Translation of Knowledge, 1580–1842</p><p>Tracing encounters between Chinese and European traditions of geography and cartography.</p><a className="text-link" href="https://doi.org/10.1017/9781009636049">Explore the book <span aria-hidden="true">↗</span></a> <a className="text-link" href="/map-study/">Explore the map film <span aria-hidden="true">↗</span></a> <a className="text-link" href="/sino-western-maps/">Explore the map catalogue <span aria-hidden="true">↗</span></a></div></article>
        </section>
        <footer><span>Florin-Stefan Morar</span><a href="mailto:morar@nus.edu.sg">Get in touch ↗</a></footer>
      </div>
    </main>
  </>;
}
