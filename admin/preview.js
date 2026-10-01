CMS.registerPreviewStyle(
    'html, body { margin: 0; height: 100%; } iframe.sitePreview { display: block; width: 100%; height: 100vh; border: 0; }',
    { raw: true }
);

function toPlain(value) {
  if (value && typeof value.toJS === 'function') return value.toJS();
  return value ?? [];
}

const ProjectsPreview = createClass({
  sendProjects: function () {
    const frame = this.frame;
    if (!frame || !frame.contentWindow) return;

    const { entry, getAsset } = this.props;
    const projects = toPlain(entry.getIn(['data', 'projects'])).map(function (project) {
      const asset = project.thumbnail ? getAsset(project.thumbnail) : null;
      return Object.assign({}, project, {
        thumbnail: project.thumbnail ? (asset ? asset.url : project.thumbnail) : '',
      });
    });

    frame.contentWindow.postMessage({ type: 'cms-preview', projects: projects }, window.location.origin);
  },

  componentDidUpdate: function () {
    this.sendProjects();
  },

  render: function () {
    const self = this;
    return h('iframe', {
      className: 'sitePreview',
      src: '/?cms-preview',
      ref: function (el) {
        self.frame = el;
      },
      onLoad: function () {
        self.sendProjects();
      },
    });
  },
});

// "projects" = nom du fichier dans la collection de fichiers (config.yml)
CMS.registerPreviewTemplate('projects', ProjectsPreview);