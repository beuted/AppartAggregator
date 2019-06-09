<template>
    <div class="container" role="main">

    <div class="main-title">Appart aggregator</div>

    <annonce v-for="annonce in apparts" v-bind:annonce="annonce" v-bind:key="annonce.id"></annonce>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Annonce from './components/Annonce.vue';

@Component({
  components: {
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
body {
  @import url('https://fonts.googleapis.com/css?family=Roboto&display=swap');
  font-family: 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 30px;
  font-size: 16px;
}

a {
  color: #4183c4;
  text-decoration: none;
}

a:hover {
  color: #4183c4;
  text-decoration: underline
}

.container {
  margin: auto;
  width: 900px;
}

.main-title {
  width: 100%;
  margin-bottom: 15px;
  font-size: 30px;
  font-weight: bold;
  text-align: center;
}
</style>
