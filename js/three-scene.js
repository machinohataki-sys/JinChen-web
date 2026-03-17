/**
 * Jinchen Crystal — Immersive Crystal Particle Scene
 * Diamond dust + prismatic light rays + aurora shimmer
 */

(function () {
  'use strict';

  function detectWebGL() {
    try {
      var canvas = document.createElement('canvas');
      var gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return false;
      var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        var renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        if (/swiftshader|llvmpipe/i.test(renderer)) return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function shouldUse3D() {
    if (window.innerWidth < 768) return false;
    if (!detectWebGL()) return false;
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return true;
  }

  function showFallback() {
    var fallback = document.querySelector('.hero-crystal-fallback');
    if (fallback) fallback.style.display = 'block';
  }

  function initParticleScene() {
    if (!shouldUse3D()) { showFallback(); return; }

    var container = document.querySelector('.hero-crystal-canvas');
    if (!container || typeof THREE === 'undefined') { showFallback(); return; }

    try {
      // --- Renderer ---
      var renderer = new THREE.WebGLRenderer({
        antialias: false, alpha: true, powerPreference: 'high-performance'
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);

      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 300);
      camera.position.set(0, 0, 60);

      // =============================================
      // LAYER 1: Diamond Dust (main particles)
      // =============================================
      var DUST_COUNT = 2000;
      var SPREAD = 100;
      var DEPTH = 80;

      var colors = [
        new THREE.Color(0xffffff),
        new THREE.Color(0xffffff),
        new THREE.Color(0xfaf0dc),  // warm white
        new THREE.Color(0xc9a96e),  // gold
        new THREE.Color(0xe8d5a3),  // champagne
        new THREE.Color(0xa8d8ea),  // ice blue
        new THREE.Color(0x4ecdc4),  // teal
        new THREE.Color(0xa29bfe),  // lavender
        new THREE.Color(0xf8b5c4),  // rose
        new THREE.Color(0x45b7d1),  // crystal blue
      ];

      var dustPositions = new Float32Array(DUST_COUNT * 3);
      var dustColors = new Float32Array(DUST_COUNT * 3);
      var dustSizes = new Float32Array(DUST_COUNT);
      var dustVelocities = new Float32Array(DUST_COUNT * 3);
      var dustPhases = new Float32Array(DUST_COUNT);

      for (var i = 0; i < DUST_COUNT; i++) {
        var i3 = i * 3;
        var angle = Math.random() * Math.PI * 2;
        var radius = Math.pow(Math.random(), 0.5) * SPREAD;
        dustPositions[i3] = Math.cos(angle) * radius;
        dustPositions[i3 + 1] = (Math.random() - 0.5) * DEPTH;
        dustPositions[i3 + 2] = (Math.sin(angle) * radius * 0.5) + (Math.random() - 0.5) * 40;

        var color = colors[Math.floor(Math.random() * colors.length)];
        dustColors[i3] = color.r;
        dustColors[i3 + 1] = color.g;
        dustColors[i3 + 2] = color.b;

        var roll = Math.random();
        if (roll > 0.98) dustSizes[i] = 3.0 + Math.random() * 2.5;       // rare brilliant sparkle
        else if (roll > 0.90) dustSizes[i] = 1.5 + Math.random() * 1.5;   // medium gem
        else dustSizes[i] = 0.3 + Math.random() * 1.0;                    // fine dust

        dustVelocities[i3] = (Math.random() - 0.5) * 0.01;
        dustVelocities[i3 + 1] = (Math.random() - 0.5) * 0.008 + 0.004;
        dustVelocities[i3 + 2] = (Math.random() - 0.5) * 0.006;
        dustPhases[i] = Math.random() * Math.PI * 2;
      }

      var dustGeo = new THREE.BufferGeometry();
      dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
      dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));
      dustGeo.setAttribute('size', new THREE.BufferAttribute(dustSizes, 1));

      var dustVS = [
        'attribute float size;',
        'varying vec3 vColor;',
        'varying float vAlpha;',
        'uniform float uTime;',
        'uniform float uMouseX;',
        'uniform float uMouseY;',
        'void main() {',
        '  vColor = color;',
        '  float phase = position.x * 0.4 + position.y * 0.3 + position.z * 0.2;',
        '  float twinkle = 0.4 + 0.6 * sin(uTime * 1.2 + phase);',
        '  float flash = pow(max(0.0, sin(uTime * 3.0 + phase * 5.0)), 20.0);',
        '  vAlpha = (0.2 + 0.8 * twinkle + flash * 0.5);',
        '  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
        '  float depth = -mvPosition.z;',
        '  vAlpha *= smoothstep(100.0, 15.0, depth);',
        '  vec3 displaced = position;',
        '  float dx = displaced.x - uMouseX * 40.0;',
        '  float dy = displaced.y - uMouseY * 25.0;',
        '  float dist = sqrt(dx * dx + dy * dy);',
        '  float repulse = smoothstep(0.0, 30.0, dist);',
        '  displaced.x += (1.0 - repulse) * dx * 0.08;',
        '  displaced.y += (1.0 - repulse) * dy * 0.08;',
        '  mvPosition = modelViewMatrix * vec4(displaced, 1.0);',
        '  gl_PointSize = size * (350.0 / -mvPosition.z) * (0.7 + 0.5 * twinkle + flash);',
        '  gl_Position = projectionMatrix * mvPosition;',
        '}'
      ].join('\n');

      var dustFS = [
        'varying vec3 vColor;',
        'varying float vAlpha;',
        'void main() {',
        '  float dist = length(gl_PointCoord - vec2(0.5));',
        '  if (dist > 0.5) discard;',
        '  float core = 1.0 - smoothstep(0.0, 0.12, dist);',
        '  float glow = 1.0 - smoothstep(0.0, 0.5, dist);',
        '  float spike = max(0.0, 1.0 - abs(gl_PointCoord.x - 0.5) * 8.0) * (1.0 - dist * 2.0);',
        '  spike += max(0.0, 1.0 - abs(gl_PointCoord.y - 0.5) * 8.0) * (1.0 - dist * 2.0);',
        '  float alpha = (core * 1.0 + glow * 0.4 + spike * 0.3) * vAlpha;',
        '  vec3 color = vColor + core * 0.5;',
        '  gl_FragColor = vec4(color, alpha);',
        '}'
      ].join('\n');

      var dustMat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uMouseX: { value: 0 }, uMouseY: { value: 0 } },
        vertexShader: dustVS, fragmentShader: dustFS,
        transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, vertexColors: true
      });

      var dustParticles = new THREE.Points(dustGeo, dustMat);
      scene.add(dustParticles);

      // =============================================
      // LAYER 2: Shooting Stars (fast streaking particles)
      // =============================================
      var STAR_COUNT = 15;
      var starData = [];
      for (var s = 0; s < STAR_COUNT; s++) {
        starData.push({
          x: (Math.random() - 0.5) * SPREAD * 2,
          y: (Math.random() - 0.5) * DEPTH,
          z: (Math.random() - 0.5) * 40 - 20,
          vx: (Math.random() - 0.3) * 0.8,
          vy: (Math.random() - 0.5) * 0.3,
          life: Math.random() * 200,
          maxLife: 200 + Math.random() * 300,
          size: 1.5 + Math.random() * 2.0
        });
      }

      var starPositions = new Float32Array(STAR_COUNT * 3);
      var starSizes = new Float32Array(STAR_COUNT);
      var starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

      var starVS = [
        'attribute float size;',
        'varying float vAlpha;',
        'void main() {',
        '  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);',
        '  gl_PointSize = size * (300.0 / -mvPos.z);',
        '  vAlpha = smoothstep(100.0, 10.0, -mvPos.z);',
        '  gl_Position = projectionMatrix * mvPos;',
        '}'
      ].join('\n');

      var starFS = [
        'varying float vAlpha;',
        'void main() {',
        '  float dist = length(gl_PointCoord - vec2(0.5));',
        '  if (dist > 0.5) discard;',
        '  float core = 1.0 - smoothstep(0.0, 0.15, dist);',
        '  float glow = 1.0 - smoothstep(0.0, 0.5, dist);',
        '  float alpha = (core + glow * 0.5) * vAlpha;',
        '  gl_FragColor = vec4(1.0, 0.95, 0.85, alpha);',
        '}'
      ].join('\n');

      var starMat = new THREE.ShaderMaterial({
        vertexShader: starVS, fragmentShader: starFS,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      });

      var starParticles = new THREE.Points(starGeo, starMat);
      scene.add(starParticles);

      // =============================================
      // LAYER 3: Aurora Glow (large soft color blobs)
      // =============================================
      var GLOW_COUNT = 6;
      var glowPositions = new Float32Array(GLOW_COUNT * 3);
      var glowColors = new Float32Array(GLOW_COUNT * 3);
      var glowSizes = new Float32Array(GLOW_COUNT);
      var glowPhases = [];

      var auroraColors = [
        new THREE.Color(0x4ecdc4),   // teal
        new THREE.Color(0xa29bfe),   // purple
        new THREE.Color(0x45b7d1),   // blue
        new THREE.Color(0xc9a96e),   // gold
        new THREE.Color(0xf8b5c4),   // pink
        new THREE.Color(0x74b9ff),   // sky
      ];

      for (var g = 0; g < GLOW_COUNT; g++) {
        var g3 = g * 3;
        glowPositions[g3] = (Math.random() - 0.5) * 80;
        glowPositions[g3 + 1] = (Math.random() - 0.5) * 50;
        glowPositions[g3 + 2] = -30 - Math.random() * 30;
        glowColors[g3] = auroraColors[g].r;
        glowColors[g3 + 1] = auroraColors[g].g;
        glowColors[g3 + 2] = auroraColors[g].b;
        glowSizes[g] = 40 + Math.random() * 30;
        glowPhases.push({ px: Math.random() * 6.28, py: Math.random() * 6.28, speed: 0.15 + Math.random() * 0.2 });
      }

      var glowGeo = new THREE.BufferGeometry();
      glowGeo.setAttribute('position', new THREE.BufferAttribute(glowPositions, 3));
      glowGeo.setAttribute('color', new THREE.BufferAttribute(glowColors, 3));
      glowGeo.setAttribute('size', new THREE.BufferAttribute(glowSizes, 1));

      var glowVS = [
        'attribute float size;',
        'varying vec3 vColor;',
        'void main() {',
        '  vColor = color;',
        '  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);',
        '  gl_PointSize = size * (300.0 / -mvPos.z);',
        '  gl_Position = projectionMatrix * mvPos;',
        '}'
      ].join('\n');

      var glowFS = [
        'varying vec3 vColor;',
        'void main() {',
        '  float dist = length(gl_PointCoord - vec2(0.5));',
        '  if (dist > 0.5) discard;',
        '  float alpha = smoothstep(0.5, 0.0, dist) * 0.07;',
        '  gl_FragColor = vec4(vColor, alpha);',
        '}'
      ].join('\n');

      var glowMat = new THREE.ShaderMaterial({
        vertexShader: glowVS, fragmentShader: glowFS,
        transparent: true, depthWrite: false,
        blending: THREE.AdditiveBlending, vertexColors: true
      });

      var glowParticles = new THREE.Points(glowGeo, glowMat);
      scene.add(glowParticles);

      // =============================================
      // Mouse & Animation
      // =============================================
      var mouseX = 0, mouseY = 0, targetMouseX = 0, targetMouseY = 0;

      document.addEventListener('mousemove', function (e) {
        targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
        targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      });

      var resizeTimeout;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function () {
          if (!container.clientWidth || !container.clientHeight) return;
          camera.aspect = container.clientWidth / container.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(container.clientWidth, container.clientHeight);
        }, 200);
      });

      var clock = new THREE.Clock();
      var dustPosAttr = dustGeo.attributes.position;
      var starPosAttr = starGeo.attributes.position;
      var starSizeAttr = starGeo.attributes.size;
      var glowPosAttr = glowGeo.attributes.position;

      function animate() {
        requestAnimationFrame(animate);

        var rect = renderer.domElement.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;

        var t = clock.getElapsedTime();

        mouseX += (targetMouseX - mouseX) * 0.03;
        mouseY += (targetMouseY - mouseY) * 0.03;

        dustMat.uniforms.uTime.value = t;
        dustMat.uniforms.uMouseX.value = mouseX;
        dustMat.uniforms.uMouseY.value = mouseY;

        // Drift dust particles
        for (var i = 0; i < DUST_COUNT; i++) {
          var i3 = i * 3;
          dustPosAttr.array[i3] += dustVelocities[i3] + Math.sin(t * 0.3 + dustPhases[i]) * 0.004;
          dustPosAttr.array[i3 + 1] += dustVelocities[i3 + 1] + Math.cos(t * 0.2 + dustPhases[i] * 1.3) * 0.003;
          dustPosAttr.array[i3 + 2] += dustVelocities[i3 + 2];

          if (dustPosAttr.array[i3] > SPREAD) dustPosAttr.array[i3] = -SPREAD;
          if (dustPosAttr.array[i3] < -SPREAD) dustPosAttr.array[i3] = SPREAD;
          if (dustPosAttr.array[i3 + 1] > DEPTH * 0.5) dustPosAttr.array[i3 + 1] = -DEPTH * 0.5;
          if (dustPosAttr.array[i3 + 1] < -DEPTH * 0.5) dustPosAttr.array[i3 + 1] = DEPTH * 0.5;
          if (dustPosAttr.array[i3 + 2] > 40) dustPosAttr.array[i3 + 2] = -40;
          if (dustPosAttr.array[i3 + 2] < -40) dustPosAttr.array[i3 + 2] = 40;
        }
        dustPosAttr.needsUpdate = true;

        // Shooting stars
        for (var s = 0; s < STAR_COUNT; s++) {
          var sd = starData[s];
          sd.life++;
          if (sd.life > sd.maxLife) {
            sd.x = (Math.random() - 0.5) * SPREAD * 2;
            sd.y = (Math.random() - 0.5) * DEPTH;
            sd.z = (Math.random() - 0.5) * 40 - 20;
            sd.vx = (Math.random() - 0.3) * 0.8;
            sd.vy = (Math.random() - 0.5) * 0.3;
            sd.life = 0;
            sd.maxLife = 200 + Math.random() * 300;
          }
          sd.x += sd.vx;
          sd.y += sd.vy;
          var lifeRatio = sd.life / sd.maxLife;
          var fadeIn = Math.min(1.0, lifeRatio * 5.0);
          var fadeOut = Math.max(0.0, 1.0 - (lifeRatio - 0.7) / 0.3);
          var alpha = fadeIn * (lifeRatio > 0.7 ? fadeOut : 1.0);

          var s3 = s * 3;
          starPosAttr.array[s3] = sd.x;
          starPosAttr.array[s3 + 1] = sd.y;
          starPosAttr.array[s3 + 2] = sd.z;
          starSizeAttr.array[s] = sd.size * alpha;
        }
        starPosAttr.needsUpdate = true;
        starSizeAttr.needsUpdate = true;

        // Aurora drift
        for (var g = 0; g < GLOW_COUNT; g++) {
          var gp = glowPhases[g];
          var g3 = g * 3;
          glowPosAttr.array[g3] += Math.sin(t * gp.speed + gp.px) * 0.15;
          glowPosAttr.array[g3 + 1] += Math.cos(t * gp.speed * 0.7 + gp.py) * 0.1;
        }
        glowPosAttr.needsUpdate = true;

        // Global rotation
        dustParticles.rotation.y = t * 0.012 + mouseX * 0.15;
        dustParticles.rotation.x = mouseY * 0.08;
        glowParticles.rotation.y = t * 0.008 + mouseX * 0.1;

        renderer.render(scene, camera);
      }

      animate();

      // Scroll fade
      if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        gsap.to(container, {
          opacity: 0, ease: 'none',
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
        });
      }

      window.addEventListener('beforeunload', function () {
        dustGeo.dispose(); dustMat.dispose();
        starGeo.dispose(); starMat.dispose();
        glowGeo.dispose(); glowMat.dispose();
        renderer.dispose();
      });

    } catch (err) {
      console.error('Particle scene failed:', err);
      showFallback();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParticleScene);
  } else {
    initParticleScene();
  }
})();
