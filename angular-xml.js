(function(ng) {

  function responseIsXml(response) {
    var contentType = response.headers('content-type');
    return (
              (contentType && contentType.search(/\Wxml/i) > -1)
              || (angular.isString(response.data) && /^<\?xml/i.test(response.data))
           );
  }

  function xmlHttpInterceptorFactory($q) {
    function responseHandler(response) {
      if (response && responseIsXml(response)) {
        response.data = xmlToJson(jQuery.parseXML(response.data));
        return response;
      } else {
        return $q.when(response);
      }
    }
    function responseErrorHandler(response) {
      if (response && responseIsXml(response)) {
        response.data = xmlToJson(jQuery.parseXML(response.data));
      }
      return $q.reject(response);
    }
    return {
      response: responseHandler,
      responseError: responseErrorHandler
    };
  }

  function configProvider($provide) {
    $provide.factory('xmlHttpInterceptor', ['$q', xmlHttpInterceptorFactory]);
  }

  // See https://davidwalsh.name/convert-xml-json / http://plnkr.co/edit/YLJSNv?p=info
  function xmlToJson(xml) {
      
    // Create the return object
    var obj = {};

    if (xml.nodeType == 1) { // element
      // do attributes
      if (xml.attributes.length > 0) {
        //obj["attributes"] = {};
        for (var j = 0; j < xml.attributes.length; j++) {
          var attribute = xml.attributes.item(j);
          //obj["attributes"][attribute.nodeName] = attribute.nodeValue;
          obj['@' + attribute.nodeName] = attribute.nodeValue;
        }
      }
    } else if (xml.nodeType == 3) { // text
      obj = xml.nodeValue.trim(); // add trim here
    }

    // do children
    if (xml.hasChildNodes()) {
      for (var i = 0; i < xml.childNodes.length; i++) {
        var item = xml.childNodes.item(i);
        var nodeName = item.nodeName;
        //  console.debug('child',nodeName,item)
        if (typeof(obj[nodeName]) == "undefined") {
          var tmp = xmlToJson(item);
          if (tmp !== "") // if not empty string
            obj[nodeName] = tmp;
        } else {
          if (typeof(obj[nodeName].push) == "undefined") {
            var old = obj[nodeName];
            obj[nodeName] = [];
            obj[nodeName].push(old);
          }
          var tmp = xmlToJson(item);
          if (tmp !== "") // if not empty string
            obj[nodeName].push(tmp);
        }
      }
    }
    if (!Array.isArray(obj) && typeof obj == 'object') {
      var keys = Object.keys(obj);
      if (keys.length == 1 && keys[0] == '#text') return obj['#text'];
      if (keys.length === 0) return null;
    }
    return obj;
  };

  if (ng) {
    ng
      .module('xml', [])
      .config(['$provide', configProvider])
      .factory('xmlToJson', function() {
         return { convert: xmlToJson };
      });
  }

}(angular));

