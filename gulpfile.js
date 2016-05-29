var gulp = require( 'gulp' );
var del = require( 'del' );
var gutil = require( 'gulp-util' );
var bower = require( 'bower' );
var jshint = require( 'gulp-jshint' );
var concat = require( 'gulp-concat' );
var ngAnnotate = require( 'gulp-ng-annotate' );
var uglify = require( 'gulp-uglify' );
var rename = require( 'gulp-rename' );
var header = require( 'gulp-header' );
var sourcemaps = require( 'gulp-sourcemaps' );
var sh = require( 'shelljs' );

var path = {
  //sass: ['./scss/**/*.scss'],
  source: {
    root: 'src',
    fontAll: 'src/fonts/**/*.{eot,svg,ttf,woff,woff2}', // **/*.{eot,svg,ttf,woff,woff2}
    scssAll: 'src/scss/**',
    stylesheet: 'src/styles',
    javascript: 'src/scripts',
    javascriptAll: 'src/scripts/**/*.js' // here we use a globbing pattern to match everything inside the `scripts` folder
  },
  distribution: {
    root: 'dist',
    font: 'dist/fonts',
    scss: 'dist/scss',
    stylesheet: 'dist/styles',
    javascript: 'dist/scripts'
  },
  temporary: {
    root: '.temp',
    font: '.temp/fonts',
    stylesheet: '.temp/styles',
    javascript: '.temp/scripts'
  }
};
/*
 * ionic.bundle.js is a concatenation of:
 * ionic.js, ionic-angular.js
 * angular.js, angular-animate.js, angular-sanitize.js, angular-ui-router.js,

 <script src="bower_components/angular/angular.js"></script>
 <script src="bower_components/angular-animate/angular-animate.js"></script>
 <script src="bower_components/angular-sanitize/angular-sanitize.js"></script>
 <script src="bower_components/angular-ui-router/release/angular-ui-router.js"></script>
 <script src="bower_components/ionic/release/js/ionic.js"></script>
 <script src="bower_components/ionic/release/js/ionic-angular.js"></script>

 */
var srcVendor = [
  'bower_components/ionic/release/js/ionic.bundle.min.js',
  'bower_components/ngCordova/dist/ng-cordova.min.js'
];
/*
FIXME http://docs.ionic.io/v2.0.0-beta/docs/io-config replace line in belo file
"IONIC_SETTINGS_STRING_START";"IONIC_SETTINGS_STRING_END";
with
"IONIC_SETTINGS_STRING_START";var settings = {"dev_push":false,"app_id":"2b022729","api_key":"aefe0d12065e3a89cc2ffbe5fce4df6a8e77b0b85a39a95a","gcm_key":"999215739807"}; return { get: function(setting) { if (settings[setting]) { return settings[setting]; } return null; } };"IONIC_SETTINGS_STRING_END";
FIXME generate and replcae bower component with this '.temp/ionic.io.bundle.js'
*/
var srcPlugins = [
  //'bower_components/ionic-platform-web-client/dist/ionic.io.bundle.js',
  'bower_components/lodash/lodash.min.js',
  'bower_components/angular-filter/dist/angular-filter.min.js',
  'bower_components/angular-wizard/dist/angular-wizard.min.js',

  'bower_components/angular-translate/angular-translate.min.js',
  'bower_components/angular-translate-loader-static-files/angular-translate-loader-static-files.min.js',
  'bower_components/angulartics/dist/angulartics.min.js',
  'bower_components/angulartics/dist/angulartics-ga-cordova-google-analytics-plugin.min.js'
];
//XX'bower_components/angulartics/dist/angulartics-ga-cordova.min.js'

/*
Usage : uglifySrc(path.source.javascriptAll, 'lion-fish.js', path.distribution.root)
*/
var uglifySrc = function ( src, fileName, dest ) {
  var headerValue = '//Evaluated by gulp.\n';
  return gulp.src( src )
    .pipe( sourcemaps.init() ) // Process the original sources
    .pipe( concat( fileName ) )
    .pipe( rename( {
      extname: '.min.js'
    } ) )
    .pipe( ngAnnotate() )
    .pipe( uglify() )
    .pipe( header( headerValue ) )
    .pipe( sourcemaps.write( '.' ) ) // Add the map to modified source.
    .pipe( gulp.dest( dest ) );
};

gulp.task( 'scripts', function () {
  uglifySrc( srcVendor, 'common-vendor.js', path.distribution.javascript ); //temporary.javascript
  uglifySrc( srcPlugins, 'common-plugins.js', path.distribution.javascript );
  uglifySrc( path.source.javascriptAll, 'common-scripts.js', path.distribution.javascript );
} );

gulp.task( 'copy', function () {
  // -OR- just 'bower_components/ionic/scss/**.scss'
  gulp.src( [ 'bower_components/ionic/scss/**', '!bower_components/ionic/scss/ionicons', '!bower_components/ionic/scss/ionicons/**' ] )
    .pipe( gulp.dest( path.distribution.scss + '/ionic' ) );
  gulp.src( [ 'bower_components/Ionicons/scss/**' ] )
    .pipe( gulp.dest( path.distribution.scss + '/ionicons' ) );
  gulp.src( 'bower_components/Ionicons/fonts/**/*.{eot,svg,ttf,woff,woff2}' )
    .pipe( gulp.dest( path.distribution.font ) ); //+'/ionicons'
  //gulp.src('bower_components/ionic/release/fonts/**').pipe(gulp.dest(path.distribution.font));
  gulp.src( path.source.scssAll )
    .pipe( gulp.dest( path.distribution.scss ) );
  gulp.src( path.source.fontAll )
    .pipe( gulp.dest( path.distribution.font ) );
} );


/*
 * passing js code through the default linting engine
 * configure the jshint task
 */
/*
TODO test
app/public/scripts/features/share/env-service.js
 line 23  col 13  Duplicate key 'dbCustomer'.
*/
gulp.task( 'lint', function () {
  return gulp.src( path.source.javascriptAll )
    .pipe( jshint() )
    .pipe( jshint.reporter( 'jshint-stylish' ) );
} );


/* gulp install */
gulp.task( 'install', [ 'git-check' ], function () {
  return bower.commands.install()
    .on( 'log', function ( data ) {
      gutil.log( 'bower', gutil.colors.cyan( data.id ), data.message );
    } );
} );

gulp.task( 'git-check', function ( done ) {
  if ( !sh.which( 'git' ) ) {
    console.log(
      '  ' + gutil.colors.red( 'Git is not installed.' ),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan( 'http://git-scm.com/downloads' ) + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan( 'gulp install' ) + '\' again.'
    );
    process.exit( 1 );
  }
  done();
} );

gulp.task( 'clean', function ( done ) {
  //EEXIST errors fix run sync
  return del.sync( [
    path.distribution.root,
    path.temporary.root
  ] );
  /*
  // This is not working
  return del([
    path.distribution.root,
    path.temporary.root
  ], done);
  */
} );

//gulp.task('build', ['clean', 'lint', 'copy', 'scripts']);
gulp.task( 'build', [ 'clean', 'copy', 'scripts' ] );

gulp.task( 'default', [ 'build' ], function () {
  return gutil.log( 'build is running!' )
} );
/*
clean done then build will start
gulp.task('default', ['clean'], function () {
  gulp.start('build');
});
*/
