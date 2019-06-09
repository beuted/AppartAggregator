<template>
  <div>
    <fixed-header :threshold="100">
      <div class="navbar">
        <div class="main-title">Appart aggregator
        </div>
        <button class="navbar-restore">
            restore annonce
            <i class="fa fa-reply" aria-hidden="true"></i>
          </button>
      </div>
    </fixed-header>
    <div class="container">

      <annonce v-for="annonce in apparts" v-bind:annonce="annonce" v-bind:key="annonce.id"></annonce>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Annonce from './components/Annonce.vue';
import FixedHeader from 'vue-fixed-header'

@Component({
  components: {
    FixedHeader,
    Annonce,
  },
})
export default class App extends Vue {

  public apparts: any[] = [];

  public mounted() {
      this.fetchAnnonces();
  }

  public fetchAnnonces() {
      this.$http.get('/api/apparts').then(
        response => {
          if (response.status == 200)
          {
            this.apparts = response.data;
            console.log(response.data);
          }
          else
          {
            console.error(JSON.stringify(response));
            this.apparts = [];
          }
        }, response => {
            console.error(JSON.stringify(response));
            this.apparts = [];
        });
    }
}
</script>

<style lang="scss">
// Whipe out browser CSS rules =================
body {
  @import url('https://fonts.googleapis.com/css?family=Roboto&display=swap');
  font-family: 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  font-size: 16px;
  margin: 0;
  padding: 0;
}

a {
  color: #4183c4;
  text-decoration: none;
}

a:hover {
  color: #4183c4;
  text-decoration: underline
}

button {
  color: #2c3e50;
  border-width: 0;
  cursor: pointer;
  background-color: transparent;

  &:hover {
    background-color:rgba($color: #000000, $alpha: 0.1);
  }
  &:focus {
    outline: 0;
  }
}
// =============================================


.container {
  margin-top: 30px;
  margin: 30px auto 0 auto;
  width: 900px;
}

.navbar {
  position: relative;
  background-color: #f7f7f7;
  height: 50px;
  box-shadow: 0px 0px 5px 1px #cccccc;
}

.navbar.vue-fixed-header--isFixed {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
}

.main-title {
  position: absolute;
  width: 100%;
  padding-top: 5px;
  font-size: 30px;
  font-weight: bold;
  text-align: center;
}


.navbar-restore {
  position: relative;
  float: right;
  margin-top: 10px;
  margin-right: 30px;
  height: 30px;
  font-size: 16px;
}
</style>
