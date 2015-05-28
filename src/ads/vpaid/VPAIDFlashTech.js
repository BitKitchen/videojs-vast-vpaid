function VPAIDFlashTech(mediaFile) {
  if (!(this instanceof VPAIDFlashTech)) {
    return new VPAIDFlashTech(mediaFile);
  }
  sanityCheck(mediaFile);
  this.mediaFile = mediaFile;
  this.containerEl = null;
  this.vpaidFlashToJS = null;

  /*** local functions ***/
  function sanityCheck(mediaFile) {
    if(!mediaFile || !isString(mediaFile.src)){
      throw new VASTError('on VPAIDFlashTech, invalid MediaFile');
    }

  }
}

VPAIDFlashTech.supports = function (type) {
  return type === 'application/x-shockwave-flash';
};

VPAIDFlashTech.prototype.loadAdUnit = function loadFlashCreative(containerEl, callback) {
  var that = this;
  sanityCheck(containerEl, callback);

  this.containerEl = containerEl;
  this.vpaidFlashToJS = new VPAIDFlashToJS(containerEl, function (error) {
    if(error) {
      callback(error);
    }

    that.vpaidFlashToJs.loadAdUnit(that.mediaFile.src, callback)
  });


  /*** Local Functions ***/
  function sanityCheck(container, cb) {

    if(!dom.isDomElement(container)){
      throw new VASTError('on VPAIDFlashTech.loadAdUnit, invalid dom container element');
    }

    if(!isFunction(cb)){
      throw new VASTError('on VPAIDFlashTech.loadAdUnit, missing valid callback');
    }
  }
};


VPAIDFlashTech.prototype.unloadAdUnit = function() {
    if(this.vpaidFlashToJS) {
      this.vpaidFlashToJS.unloadAdUnit();
      this.vpaidFlashToJS = null;
    }

    if(this.containerEl) {
      this.containerEl.innerHTML = '';
      this.containerEl = null;
    }
};
