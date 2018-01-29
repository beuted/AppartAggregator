Vue.component('app-bar', {
  template: `
    <nav class="navbar navbar-inverse">
    <div class="container">
      <div class="navbar-header">
        <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false">
          <span class="sr-only">Toggle navigation</span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
          <span class="icon-bar"></span>
        </button>
        <a class="navbar-brand" href="#">Eth Places Registrator</a>
      </div>
      <div id="navbar" class="navbar-collapse collapse">
        <ul class="nav navbar-nav">
          <li><a onclick="DApp.RefreshUI()">Refresh UI</a></li>
          <li><a href="#fulfill">Fulfill promise</a></li>
          <li><a href="#admin">Administer</a></li>
        </ul>
      </div>
    </div>
  </nav>`
});

Vue.component('app-body', {
  template: `<div class="container theme-showcase" role="main">

    <div class="starter-template">
      <h1>Aggregator d'appart</h1>
      <p class="lead">Let's go!</p>
    </div>

    <annonce v-for="item in apparts" v-bind:annonce="item"></annonce>
  </div>`,

  data: function() {
    return {
      apparts: []
    }
  },

  mounted: function () {
      this.fetchAnnonces();
  },

  methods: {
    fetchAnnonces: function() {
      this.apparts = [{
          title: "mon appart trop bi1",
          description:"yolo",
          departement: "Parsi 17 yop",
          photos: [],
          price: 886,
          adCreatedByPro: true,
          district: "paris 17 yoyo",
          surfaceArea: 35,
      },
      {
          title: "mon appart trop cher",
          description:"yolo 2",
          departement: "Parsi 18 yeop",
          photos: [],
          price: 887,
          adCreatedByPro: false,
          district: "paris 18 yoeyeo",
          surfaceArea: 32,
      }];
    }
  }
});

Vue.component('annonce', {
  props: ['annonce'],
  template: `
<div class="panel panel-primary">
    <div class="panel-heading">
        <h3 class="panel-title">{{annonce.title}}</h3>
    </div>
    <div class="panel-body">
        <p>{{annonce.description}}</p>
    </div>
</div>`
});

new Vue({
  el: '#app',
  mounted: function() {
  },
  data: {
  }
});
