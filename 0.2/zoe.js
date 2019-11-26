  /* ZOE 0.2 */
  
  (function (exports)
  {
      var ZOE = (function ()
      {
          // Create an HTMLElement object out of a JS object
          function elementBuild(elemObj, elemName)
          {
              var e = document.createElement(elemObj.element || "div");
              if (elemObj.classes !== undefined) e['className'] = elemObj.classes;
              for (var a in elemObj.attributes)
              {
                  //e[a] = elemObj.attributes[a];
                  e.setAttribute(a, elemObj.attributes[a]);
              }
              for (var a in elemObj.dattributes)
                  e.setAttribute('data-' + a, elemObj.dattributes[a]);

              if (elemObj.content !== undefined) e.textContent = elemObj.content;
              e.setAttribute('data-name', elemName);
              if (elemObj.helper !== undefined) e.setAttribute('data-helper', elemObj.helper);
              if (elemObj.repeat !== undefined) e.setAttribute('data-repeater', elemObj.repeat);
              if (elemObj.bind   !== undefined) e.setAttribute('data-bind', elemObj.bind);
              return e;
          }

          // Recursive function to build HTMLElement tree
          function treeBuild(root, tree, elemName)
          {
              tree = elementBuild(root, elemName);
              if (root.children !== undefined)
              {
                  for (var c in root.children)
                  {
                      var ch = root.children[c];
                      var subtree = treeBuild(ch, subtree, c);
                      tree.appendChild(subtree);
                  }
              }
              return tree;
          }

          // Bind a central event delegation function to the root of the component
          function eventDelegate(elem)
          {
              for (var evt in this.events)
              {
                  elem.addEventListener = elem.addEventListener || elem.attachEvent;
                  elem.addEventListener(evt, function (event)
                  {
                      if (this[event.target.getAttribute('data-name')] !== undefined)
                          this[event.target.getAttribute('data-name')].call(event.target, event);
                  } .bind(this.events[evt]), false);
              }

              elem.addEventListener("change", function (event)
              {
                  var target = event.target;
                  if (target.dataset.bind !== undefined)
                  {
                      var t = target.getAttribute('type'), val;
                      if (t !== undefined && t !== null)
                      {
                          if (t == "text" || t == "tel" || t == "search" || t == "password" || t == "number" || t == "email")
                              val = target.value;
                          else if (t == "checkbox")
                              val = target.checked;
                      }
                      else if (target.nodeName == "TEXTAREA")
                          val = target.value;
                      else if (target.nodeName == "SELECT")
                          val = target.options[target.selectedIndex].value;

                      //if (target.context[target.dataset.bind] === undefined)
                      //    target.context[target.dataset.bind] = {};
                      target.context[target.dataset.bind][target.dataset.name] = isNaN(val) ? val : Number(val);
                  }
              });
          }

          // replaces data-holders (@...) with their value from context object
          function dataBind(content, context)
          {
              var mod = content, is, ie = 0, k;
              while ((is = mod.indexOf("@")) > -1)
              {
                  ie = mod.indexOf(" ", is);
                  if (ie === -1) ie = mod.length;
                  k = mod.substring(is, ie);
                  mod = mod.replace(k, context[k.substring(1)]);
              }
              return mod;
          }

          // Replace data-property placeholders with their values
          function resolveData(node, context) {
              var dsrc = node.getAttribute('dsrc');
              if (dsrc !== null)
              {
                  var keyIndex = dsrc.indexOf("@");
                  node.removeAttribute('dsrc');
                  node.setAttribute('src', dsrc.substring(0, keyIndex) + context[dsrc.substring(keyIndex + 1)]);
              }

              var att, attval, keyIndex;
              for (var i = 0, len = node.attributes.length; i < len; i++)
              {
                  att = node.attributes[i];
                  attval = att.nodeValue;

                  if ((keyIndex = attval.indexOf("@")) >= 0) {
                      att.nodeValue = attval.substring(0, keyIndex) + context[attval.substring(keyIndex + 1)];
                      if (att.nodeName == "value") node.valueTemplate = attval;
                  }
              }
              var textnode = node.firstChild;
              if (textnode && textnode !== undefined && textnode.nodeType == 3 && textnode.textContent.indexOf("@") > -1 && context !== undefined)
              {
                  node.contentTemplate = textnode.textContent;
                  textnode.textContent = dataBind(textnode.textContent, context);
              }
              return node;
          }

          // load content of an existing rendered element from a new context
          function refresh(elem, context)
          {
              if (elem.firstChild !== undefined && elem.firstChild !== null && elem.firstChild.nodeType == 3 && elem.contentTemplate !== undefined)
                  elem.firstChild.textContent = dataBind(elem.contentTemplate, context);

              if (elem.value && elem.valueTemplate) {
                  elem.value = dataBind(elem.valueTemplate, context);
              }
              
              var isRepeater = (elem.getAttribute('data-repeater') !== null);
              for (var i = 0; i < elem.children.length; i++)
                  refresh(elem.children[i], (isRepeater ? context[i] : context));
          }
          // Main rendering function, takes an HTMLElement "prototype" of the template - and returns a rendered cloned "instance"
          function render(comp, context, callback, ref)
          {
              var r = comp.cloneNode(true);
              r.context = context;
              if (ref === undefined)
              {
                  var refMap = {};
                  refMap.root = r;
              }
              else
                  refMap = ref;
              function renderNode(node)
              {
                  var nodeName = node.getAttribute('data-name') + (context && context.repeatKey ? context.repeatKey : "");
                  refMap[nodeName] = node;
                  node.ref = refMap;
                  if (context !== undefined)
                  {
                      node.context = context;

                      if (context.repeatKey) node.setAttribute('data-repeat-key',context.repeatKey);
                      node = resolveData(node, context);
                  }
                  node.refresh = function (newcontext=null)
                  {
                      var newcontext = newcontext ? newcontext : context;
                      refresh(node, newcontext);
                  }

                  node.rerender = function ()
                  {
                      var parent = node.parentNode;
                      var cp = (comp.dataset.name == node.dataset.name) ? comp : comp.querySelector('[data-name="' + node.dataset.name + '"]');
                      var newrender = render(cp, context, undefined, node.ref);
                      var old = parent.removeChild(node);
                      //newrender.ref[node.dataset.name] = newrender;
                      parent.appendChild(newrender);
                      delete old;
                  } .bind(this);
              }

              function renderTree(elem)
              {
                  // Call helper renderer if exists
                  var helper = elem.getAttribute('data-helper');
                  if (helper !== undefined && ZOE['helper' + helper] !== undefined)
                  {
                      var elemName = elem.getAttribute('data-name');
                      ZOE['helper' + helper].call(this, elem, context[elemName + "Data"]);
                  }

                  // Built in repeater
                  var repeater = elem.getAttribute('data-repeater');
                  if (repeater !== null && ZOE['helperRepeater'] !== undefined)
                  {
                      ZOE['helperRepeater'].call(this, elem, context[repeater]);
                  }
                  
                  renderNode(elem);
                  for (var i = 0; i < elem.children.length; i++)
                      renderTree(elem.children[i]);
              }

              renderTree(r);

              if (ref === undefined)
              {
                  eventDelegate.call(this, r);
                  if (this.events !== undefined)
                  {
                      if (this.events.created !== undefined)
                          this.events.created.call(r);
                      if (this.events.createdAsync !== undefined)
                          setTimeout(function ()
                          {
                              this.events.createdAsync.call(r);
                          } .bind(this), 0);
                  }
              }

              if (callback === undefined)
                  return r;
              else
                  callback(r);
          }

          // Starts the building process, takes care of data scoping
          function templateBuild(component)
          {
              var e = treeBuild(component.template, e, component.name);
              this.element = e;
              if (component.events !== undefined) this.events = component.events;
              this.render = function (context)
              {
                  return render.call(this, this.element, context);
              }
              this.renderAsync = function (context, renderCallback)
              {
                  setTimeout(function ()
                  {
                      render.call(this, this.element, context, renderCallback);
                  } .bind(this), 0);
              }

              this.$ = this.render;
              this.$$ = this.renderAsync;
              var readyevent = document.createEvent("Event");
              readyevent.initEvent("ZOEReady", true, false);
              readyevent.which = component.name;
              document.dispatchEvent(readyevent);
          }

          return {
              load: function (component, init)
              {
                  ZOE[component.name] = {};
                  if (init !== undefined) ZOE[component.name].init = init;
                  setTimeout(function ()
                  {
                      templateBuild.call(ZOE[component.name], component);
                  }, 0);

              },
              render: render
          }

      })();

      exports.ZOE = ZOE;

  })(window);


ZOE.helperRepeater = function (repeater, repeaterContext)
{
    var repeaterChildrenCount = repeater.children.length,
        c;

    for (c = 0, clen = repeaterContext.length; c < clen; c++)
        for (var i = 0; i < repeaterChildrenCount; i++) {
            repeaterContext[c].repeatKey = String(c);
            repeater.appendChild(ZOE.render(repeater.children[i], repeaterContext[c]));
        }

    for (c = 0; c < repeaterChildrenCount; c++)
        repeater.removeChild(repeater.firstChild);
}
