Pod::Spec.new do |s|
  s.name           = 'TopShelfCache'
  s.version        = '1.0.0'
  s.summary        = 'Shared Top Shelf cache writer for Glassfin tvOS'
  s.description    = 'Writes lightweight Top Shelf cache payloads to an App Group container for the tvOS extension.'
  s.author         = 'Glassfin'
  s.homepage       = 'https://github.com/doombadroid/glassfin'
  s.platforms      = {
    :ios => '15.1',
    :tvos => '15.1'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_VERSION' => '5.9'
  }

  s.source_files = "*.{h,m,mm,swift}"
end
