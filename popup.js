document.addEventListener('DOMContentLoaded', function() {
  // Cross-browser API compatibility
  const browserAPI = (typeof browser !== 'undefined') ? browser : chrome;
  
  const defaultSettings = {
    enabled: true,
    particleCount: 75,
    explosionPower: 25,
    particleSize: 1.0,
    gravity: 10,
    fade: true,
    fadeSpeed: 2.7
  };

  const elements = {
    globalToggle: document.getElementById('globalToggle'),
    settingsContainer: document.getElementById('settingsContainer'),
    particleCount: document.getElementById('particleCount'),
    particleCountValue: document.getElementById('particleCountValue'),
    explosionPower: document.getElementById('explosionPower'),
    explosionPowerValue: document.getElementById('explosionPowerValue'),
    particleSize: document.getElementById('particleSize'),
    particleSizeValue: document.getElementById('particleSizeValue'),
    gravity: document.getElementById('gravity'),
    gravityValue: document.getElementById('gravityValue'),
    fadeToggle: document.getElementById('fadeToggle'),
    fadeSpeed: document.getElementById('fadeSpeed'),
    fadeSpeedValue: document.getElementById('fadeSpeedValue'),
    fadeSpeedRow: document.getElementById('fadeSpeedRow'),
    resetButton: document.getElementById('resetButton')
  };

  function loadSettings() {
    try {
      const result = browserAPI.storage.sync.get(defaultSettings);
      if (result && typeof result.then === 'function') {
        // Promise-based (Firefox)
        result.then(function(settings) {
          updateUI(settings || defaultSettings);
        }).catch(function(error) {
          console.log('Failed to load settings, using defaults:', error);
          updateUI(defaultSettings);
        });
      } else {
        // Callback-based (Chrome) - shouldn't reach here but just in case
        browserAPI.storage.sync.get(defaultSettings, function(settings) {
          updateUI(settings || defaultSettings);
        });
      }
    } catch (error) {
      // Fallback to callback style for Chrome
      browserAPI.storage.sync.get(defaultSettings, function(settings) {
        if (browserAPI.runtime.lastError) {
          console.log('Storage error:', browserAPI.runtime.lastError);
          updateUI(defaultSettings);
          return;
        }
        updateUI(settings || defaultSettings);
      });
    }
  }

  function saveSettings(newSettings) {
    try {
      const result = browserAPI.storage.sync.set(newSettings);
      if (result && typeof result.then === 'function') {
        // Promise-based (Firefox)
        result.then(function() {
          return browserAPI.tabs.query({active: true, currentWindow: true});
        }).then(function(tabs) {
          if (tabs[0]) {
            return browserAPI.tabs.sendMessage(tabs[0].id, {
              action: 'updateSettings',
              settings: newSettings
            });
          }
        }).catch(function(error) {
          console.log('Failed to save settings:', error);
        });
      } else {
        // Callback-based (Chrome) - shouldn't reach here but just in case
        browserAPI.storage.sync.set(newSettings, function() {
          browserAPI.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) {
              browserAPI.tabs.sendMessage(tabs[0].id, {
                action: 'updateSettings',
                settings: newSettings
              });
            }
          });
        });
      }
    } catch (error) {
      // Fallback to callback style for Chrome
      browserAPI.storage.sync.set(newSettings, function() {
        if (browserAPI.runtime.lastError) {
          console.log('Storage error:', browserAPI.runtime.lastError);
          return;
        }
        browserAPI.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0]) {
            browserAPI.tabs.sendMessage(tabs[0].id, {
              action: 'updateSettings',
              settings: newSettings
            });
          }
        });
      });
    }
  }

  function updateUI(settings) {
    elements.globalToggle.classList.toggle('active', settings.enabled);
    elements.settingsContainer.classList.toggle('disabled-overlay', !settings.enabled);

    elements.particleCount.value = settings.particleCount;
    elements.particleCountValue.textContent = settings.particleCount;

    elements.explosionPower.value = settings.explosionPower;
    elements.explosionPowerValue.textContent = settings.explosionPower;

    elements.particleSize.value = settings.particleSize;
    elements.particleSizeValue.textContent = settings.particleSize.toFixed(1);

    elements.gravity.value = settings.gravity;
    elements.gravityValue.textContent = settings.gravity;

    elements.fadeToggle.classList.toggle('active', settings.fade);
    elements.fadeSpeedRow.style.display = settings.fade ? 'flex' : 'none';

    elements.fadeSpeed.value = settings.fadeSpeed;
    elements.fadeSpeedValue.textContent = settings.fadeSpeed.toFixed(1);
  }

  function getCurrentSettings() {
    return {
      enabled: elements.globalToggle.classList.contains('active'),
      particleCount: parseInt(elements.particleCount.value),
      explosionPower: parseInt(elements.explosionPower.value),
      particleSize: parseFloat(elements.particleSize.value),
      gravity: parseInt(elements.gravity.value),
      fade: elements.fadeToggle.classList.contains('active'),
      fadeSpeed: parseFloat(elements.fadeSpeed.value)
    };
  }

  elements.globalToggle.addEventListener('click', function() {
    elements.globalToggle.classList.toggle('active');
    const isEnabled = elements.globalToggle.classList.contains('active');
    elements.settingsContainer.classList.toggle('disabled-overlay', !isEnabled);
    
    const settings = getCurrentSettings();
    saveSettings(settings);
  });

  elements.fadeToggle.addEventListener('click', function() {
    elements.fadeToggle.classList.toggle('active');
    const isFadeEnabled = elements.fadeToggle.classList.contains('active');
    elements.fadeSpeedRow.style.display = isFadeEnabled ? 'flex' : 'none';
    
    const settings = getCurrentSettings();
    saveSettings(settings);
  });

  elements.resetButton.addEventListener('click', function() {
    updateUI(defaultSettings);
    saveSettings(defaultSettings);
  });

  const sliders = [
    { element: elements.particleCount, valueElement: elements.particleCountValue },
    { element: elements.explosionPower, valueElement: elements.explosionPowerValue },
    { element: elements.particleSize, valueElement: elements.particleSizeValue, toFixed: 1 },
    { element: elements.gravity, valueElement: elements.gravityValue },
    { element: elements.fadeSpeed, valueElement: elements.fadeSpeedValue, toFixed: 1 }
  ];

  sliders.forEach(slider => {
    slider.element.addEventListener('input', function() {
      const value = slider.toFixed ? 
        parseFloat(slider.element.value).toFixed(slider.toFixed) : 
        slider.element.value;
      slider.valueElement.textContent = value;
    });

    slider.element.addEventListener('change', function() {
      const settings = getCurrentSettings();
      saveSettings(settings);
    });
  });

  loadSettings();
});