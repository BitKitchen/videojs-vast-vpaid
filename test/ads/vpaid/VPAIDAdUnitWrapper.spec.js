describe("VPAIDAdUnitWrapper", function(){
  var vpaidAdUnit;

  beforeEach(function(){
    vpaidAdUnit = {
      'handshakeVersion': noop,
      'initAd': noop,
      'startAd': noop,
      'stopAd': noop,
      'skipAd': noop,
      'resizeAd': noop,
      'pauseAd': noop,
      'expandAd': noop,
      'collapseAd': noop,
      'subscribe': noop,
      'unsubscribe': noop,
      'unloadAdUnit': noop
    };
  });

  it("must be a function", function(){
    assert.isFunction(VPAIDAdUnitWrapper);
  });

  describe("checkVPAIDInterface", function(){
    it("must be a function", function(){
      assert.isFunction(VPAIDAdUnitWrapper.checkVPAIDInterface);
    });

    it("must return false if you pass an obj that does not fully implements the VPAID interface", function(){
      assert.isFalse(VPAIDAdUnitWrapper.checkVPAIDInterface());
      assert.isFalse(VPAIDAdUnitWrapper.checkVPAIDInterface(null));
      assert.isFalse(VPAIDAdUnitWrapper.checkVPAIDInterface(noop));
      assert.isFalse(VPAIDAdUnitWrapper.checkVPAIDInterface('foo'));
    });

    it("must return true if you pass an object that fully implements the VPAID interface", function(){
      assert.isTrue(VPAIDAdUnitWrapper.checkVPAIDInterface(vpaidAdUnit));
    });

    it("must return false if there is no method to subscribe to events", function(){
      vpaidAdUnit.subscribe = undefined;
      assert.isFalse(VPAIDAdUnitWrapper.checkVPAIDInterface(vpaidAdUnit));
    });

    it("must return true if there is a method to subscribe to events", function(){
      assert.isTrue(VPAIDAdUnitWrapper.checkVPAIDInterface(vpaidAdUnit));
      vpaidAdUnit.subscribe = undefined;
      vpaidAdUnit.on = noop;
      assert.isTrue(VPAIDAdUnitWrapper.checkVPAIDInterface(vpaidAdUnit));
      vpaidAdUnit.on = undefined;
      vpaidAdUnit.addEventListener = noop;
      assert.isTrue(VPAIDAdUnitWrapper.checkVPAIDInterface(vpaidAdUnit));
    });

    it("must return false if there is no method to unsubscribe to events", function(){
      vpaidAdUnit.unsubscribe = undefined;
      assert.isFalse(VPAIDAdUnitWrapper.checkVPAIDInterface(vpaidAdUnit));
    });

    it("must return true if there is a method to unsubscribe from events", function(){
      assert.isTrue(VPAIDAdUnitWrapper.checkVPAIDInterface(vpaidAdUnit));
      vpaidAdUnit.unsubscribe = undefined;
      vpaidAdUnit.off = noop;
      assert.isTrue(VPAIDAdUnitWrapper.checkVPAIDInterface(vpaidAdUnit));
      vpaidAdUnit.off = undefined;
      vpaidAdUnit.removeEventListener = noop;
      assert.isTrue(VPAIDAdUnitWrapper.checkVPAIDInterface(vpaidAdUnit));
    });
  });

  describe("constructor", function(){
    it("must return an instance of itself", function(){
     assert.instanceOf(VPAIDAdUnitWrapper(vpaidAdUnit), VPAIDAdUnitWrapper);
    });

    it("must throw a VASTError if the passed VPAIDAdUnit does not fully implement the VPAID api", function(){
     [null, undefined, noop, 'foo', {}, []].forEach(function(invalidAdUnit) {
       assert.throws(function () {
         new VPAIDAdUnitWrapper(invalidAdUnit);
       }, VASTError, 'on VPAIDAdUnitWrapper, the passed VPAID adUnit does not fully implement the VPAID interface');
     });
    });

    it("must complain if you pass an options that is not a hash", function(){
      assert.throws(function() {
        new VPAIDAdUnitWrapper(vpaidAdUnit, 'foo');
      }, VASTError, "on VPAIDAdUnitWrapper, expected options hash  but got 'foo'")
    });

    it("must publish the VPAIDAdUnit in '_adUnit'", function(){
      var wrapper = new VPAIDAdUnitWrapper(vpaidAdUnit);
      assert.equal(wrapper._adUnit, vpaidAdUnit);
    });
  });

  describe("instance", function(){
    var wrapper;

    beforeEach(function(){
      wrapper = new VPAIDAdUnitWrapper(vpaidAdUnit);
    });

    describe("adUnitAsyncCall", function(){
      beforeEach(function(){
        this.clock = sinon.useFakeTimers();
      });

      afterEach(function(){
        this.clock.restore();
      });

      it("must be a function", function(){
        assert.isFunction(wrapper.adUnitAsyncCall);
      });

      it("must complain if the method is not part of the adUnit", function(){
        assert.throws(function () {
          wrapper.adUnitAsyncCall('foo', noop);
        }, VASTError, "on VPAIDAdUnitWrapper.adUnitAsyncCall, invalid method name");
      });

      it("must complain if there is no callback", function(){
        assert.throws(function () {
          wrapper.adUnitAsyncCall('initAd');
        }, VASTError, "on VPAIDAdUnitWrapper.adUnitAsyncCall, missing callback");
      });

      it("must call the adUnit method", function(){
        sinon.spy(vpaidAdUnit, 'initAd');
        wrapper.adUnitAsyncCall('initAd', noop);
        sinon.assert.calledOnce(vpaidAdUnit.initAd)
      });

      it("must call the callback whenever the adUnit response comes back", function(){
        var cb = sinon.spy();
        sinon.spy(vpaidAdUnit, 'initAd');

        wrapper.adUnitAsyncCall('initAd', cb);
        var wrapperCb = firstArg(vpaidAdUnit.initAd);
        sinon.assert.notCalled(cb);
        wrapperCb(null);

        sinon.assert.calledOnce(cb);
        sinon.assert.calledWith(cb, null);

        //it must only call the callback once.
        this.clock.tick(wrapper.options.responseTimeout);
        sinon.assert.calledOnce(cb);
      });

      describe("on response timeout", function(){
        it("must call the callback with a VASTError", function(){
          var cb = sinon.spy();
          sinon.spy(vpaidAdUnit, 'initAd');

          wrapper.adUnitAsyncCall('initAd', cb);
          var wrapperCb = firstArg(vpaidAdUnit.initAd);
          sinon.assert.notCalled(cb);
          this.clock.tick(wrapper.options.responseTimeout);

          sinon.assert.calledOnce(cb);
          var error = firstArg(cb);
          assert.instanceOf(error, VASTError);
          assert.equal(error.message, "VAST Error: on VPAIDAdUnitWrapper, timeout while waiting for a response on call 'initAd'");

          //it must not call the callback again
          wrapperCb(null);
          sinon.assert.calledOnce(cb);
        });
      });
    });

    describe("on", function(){
      it("must be a function", function(){
        assert.isFunction(wrapper.on);
      });

      it("must call the subscribe method of the inner adunit", function(){
        vpaidAdUnit.on = undefined;
        vpaidAdUnit.addEventListener = undefined;
        sinon.spy(vpaidAdUnit, 'subscribe');

        wrapper.on('evtName', noop);
        sinon.assert.calledWith(vpaidAdUnit.subscribe, 'evtName', noop);
      });

      it("must call the addEventListener method of the inner adunit", function(){
        vpaidAdUnit.subscribe = undefined;
        vpaidAdUnit.on = undefined;
        vpaidAdUnit.addEventListener = sinon.spy();

        wrapper.on('evtName', noop);
        sinon.assert.calledWith(vpaidAdUnit.addEventListener, 'evtName', noop);
      });

      it("must call the on method of the inner adunit", function(){
        vpaidAdUnit.subscribe = undefined;
        vpaidAdUnit.addEventListener = undefined;
        vpaidAdUnit.on = sinon.spy();

        wrapper.on('evtName', noop);
        sinon.assert.calledWith(vpaidAdUnit.on, 'evtName', noop);
      });
    });

    describe("off", function(){
      it("must be a function", function(){
        assert.isFunction(wrapper.off);
      });

      it("must call the unsubscribe method of the inner adunit", function(){
        vpaidAdUnit.off = undefined;
        vpaidAdUnit.removeEventListener = undefined;
        sinon.spy(vpaidAdUnit, 'unsubscribe');

        wrapper.off('evtName', noop);
        sinon.assert.calledWith(vpaidAdUnit.unsubscribe, 'evtName', noop);
      });

      it("must call the removeEventListener method of the inner adunit", function(){
        vpaidAdUnit.unsubscribe = undefined;
        vpaidAdUnit.on = undefined;
        vpaidAdUnit.removeEventListener = sinon.spy();

        wrapper.off('evtName', noop);
        sinon.assert.calledWith(vpaidAdUnit.removeEventListener, 'evtName', noop);
      });

      it("must call the off method of the inner adunit", function(){
        vpaidAdUnit.unsubscribe = undefined;
        vpaidAdUnit.removeEventListener = undefined;
        vpaidAdUnit.off = sinon.spy();

        wrapper.off('evtName', noop);
        sinon.assert.calledWith(vpaidAdUnit.off, 'evtName', noop);
      });
    });

    describe("waitForEvent", function(){
      it("must be a function", function(){
        assert.isFunction(wrapper.waitForEvent);
      });

      it("must complain if you don't pass an evtName", function(){
        assert.throws(function () {
          wrapper.waitForEvent();
        }, VASTError, "on VPAIDAdUnitWrapper.waitForEvent, missing evt name");
      });
      
      it("must complain if you don't pass a callback", function(){
        assert.throws(function () {
          wrapper.waitForEvent('adInit');
        }, VASTError, "on VPAIDAdUnitWrapper.waitForEvent, missing callback");
      });

      it("must subscribe to the passed event", function(){
        var listener = sinon.spy();
        sinon.spy(wrapper, 'on');
        wrapper.waitForEvent('adInit', listener);
        sinon.assert.calledWith(wrapper.on, 'adInit', sinon.match.func);
      });

      describe("on response", function(){
        it("must call the callback with the null as the first arg and the listener args afterwards", function(){
          var callback = sinon.spy();
          var listener;
          sinon.spy(wrapper, 'on');
          wrapper.waitForEvent('adInit', callback);
          listener = secondArg(wrapper.on);

          //We simulate the response
          var evt = {type: 'adInit'};
          listener(evt, 'foo', 'bar');

          sinon.assert.calledWith(callback, null, evt, 'foo', 'bar');
        });
      });

      describe("on response timeout", function(){
        beforeEach(function(){
          this.clock = sinon.useFakeTimers();
        });

        afterEach(function(){
          this.clock.restore();
        });

        it("must call the callback with a vastError", function(){
          var callback = sinon.spy();
          var error;
          sinon.spy(wrapper, 'on');
          wrapper.waitForEvent('adInit', callback);
          this.clock.tick(wrapper.options.responseTimeout);
          sinon.assert.calledOnce(callback);
          error = firstArg(callback);

          assert.instanceOf(error, VASTError);
          assert.equal(error.message, "VAST Error: on VPAIDAdUnitWrapper.waitForEvent, timeout while waiting for event 'adInit'")
        });

        it("must not call the callback once the event response comes", function(){
          var callback = sinon.spy();
          var listener;
          sinon.spy(wrapper, 'on');
          wrapper.waitForEvent('adInit', callback);
          listener = secondArg(wrapper.on);
          this.clock.tick(wrapper.options.responseTimeout);
          sinon.assert.calledOnce(callback);
          listener('adInint');
          sinon.assert.calledOnce(callback);
        });
      });
    });
  });
});