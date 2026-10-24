Pod::Spec.new do |s|
  s.name             = 'MpvPlayer'
  s.version          = '1.0.0'
  s.summary          = 'MPV-based video player for Glassfin (Expo module)'
  s.author           = 'Glassfin'
  s.homepage         = 'https://github.com/doombadroid/glassfin'
  s.platforms        = { :ios => '15.1', :tvos => '15.1' }
  s.source           = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'MPVKit'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
