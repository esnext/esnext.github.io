/**
 * Inserts header links for all headers.
 */
function addHeaderLinks() {
  ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(addHeaderLinksForTagName);
}

/**
 * Inserts header links for all elements with the given tag name.
 *
 * @param {string} tagName e.g. "h1"
 */
function addHeaderLinksForTagName(tagName) {
  [].forEach.call(document.getElementsByTagName(tagName), addHeaderLinkToElement);
}

/**
 * Inserts a header link next to the given element if it has an id, otherwise
 * does nothing.
 *
 * @param {HTMLElement} element
 */
function addHeaderLinkToElement(element) {
  var link = document.createElement('a');
  var id = element.id;
  if (id) {
    link.href = '#' + element.id;
    link.className = 'header-link';
    link.textContent = '#';
    element.insertBefore(link, element.firstChild);
  }
}

addHeaderLinks();
