Pod::Spec.new do |s|
  s.name           = 'TipJar'
  s.version        = '1.0.0'
  s.summary        = 'Optional tips through StoreKit 2 consumable in-app purchases'
  s.description    = 'Loads the tip products and buys one; a tip unlocks nothing.'
  s.author         = 'Glassfin'
  s.homepage       = 'https://github.com/doombadroid/glassfin'
  # iOS only: StoreKit 2 needs iOS 15, the app's floor is 16.4.
  s.platforms      = { :ios => '16.4' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'StoreKit'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift}"
end
