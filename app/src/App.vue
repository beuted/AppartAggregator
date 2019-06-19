<template>
  <div>
    <fixed-header :threshold="100">
      <div class="navbar">
        <div class="navbar-title">
          Appart aggregator
          <span class="navbar-counter">{{apparts.length}}</span>
        </div>
        <button class="navbar-right" v-on:click="fetchAnnonces()">
          Validate
          <i class="fa fa-refresh" aria-hidden="true"></i>
        </button>
        <button class="navbar-right" v-on:click="toggleConfig()">
          Config
          <i class="fa fa-cog" aria-hidden="true"></i>
        </button>
        <button class="navbar-right navbar-only-starred" v-on:click="toggleOnlyStarred()">
          Only Starred
          <i v-if="!onlyStarred" class="fa fa-star-o" aria-hidden="true"></i>
          <i v-if="onlyStarred" class="fa fa-star" aria-hidden="true"></i>
        </button>
      </div>
    </fixed-header>
    <div class="container">
      <config class="config" v-if="showConfig"></config>
      <annonce v-for="annonce in displayedApparts" v-bind:annonce="annonce" v-bind:key="annonce.id"></annonce>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Config from './components/Config.vue';
import Annonce from './components/Annonce.vue';
import { NotificationService } from './services/NotificationService';
import FixedHeader from 'vue-fixed-header';

@Component({
  components: {
    FixedHeader,
    Annonce,
    Config,
  },
})
export default class App extends Vue {
  public apparts: any[] = [];
  public displayedApparts: any[] = [];
  public showConfig: boolean = false;
  public onlyStarred: boolean = false;

  private notificationService!: NotificationService;

  public mounted() {
    this.fetchAnnoncesLoop();

    this.notificationService = new NotificationService();
    this.notificationService.Init();
  }

  public toggleConfig() {
    this.showConfig = !this.showConfig;
  }

  public async fetchAnnonces() {
    const responseApparts = await this.$http.get('/api/apparts');

    if (responseApparts.status == 200)
    {
      let currAppartIds = this.apparts.map(x => x.id);
      let newIds = responseApparts.data.map((x: any) => x.id).filter((id: string) => currAppartIds.findIndex(i => i === id) == -1);
      if (newIds.length != 0) {
        new Notification(`${newIds.length} New appartments have been found !`);
      }
    }
    else
    {
      console.error(JSON.stringify(responseApparts));
      this.apparts = [];
      return;
    }

    // Set the starred appart
    const responseStarredApparts = await this.$http.get('/api/apparts/starred');
    let apparts: any[] = responseApparts.data;
    for (const appart of apparts)
      appart.isStarred = responseStarredApparts.data.findIndex((starredId: string) => appart.id == starredId) !== -1;

    this.apparts = apparts;
    this.computeDisplayedApparts();
  }

  public toggleOnlyStarred() {
    this.onlyStarred = !this.onlyStarred;
    this.computeDisplayedApparts();
  }

  private fetchAnnoncesLoop() {
      this.fetchAnnonces()
      setTimeout(() => {
        this.fetchAnnoncesLoop();
      }, 30000);
  }

  private computeDisplayedApparts() {
    if (this.onlyStarred)
      this.displayedApparts = this.apparts.filter(x => x.isStarred);
    else
      this.displayedApparts = this.apparts;
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
  @media screen and (max-width: 900px) {
    width: 470px;
    margin-left: 5px;
  }
}

.navbar {
  width: 100%;
  min-width: 480px;
  position: relative;
  background-color: #f7f7f7;
  height: 50px;
  box-shadow: 0px 0px 5px 1px #cccccc;
  z-index: 300;
}

.navbar.vue-fixed-header--isFixed {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
}

.navbar-title {
  position: absolute;
  width: 100%;
  padding-top: 5px;
  font-size: 30px;
  font-weight: bold;
  text-align: center;
  @media screen and (max-width: 900px) {
    font-size: 20px;
    padding-top: 10px;
    text-align: left;
    padding-left: 20px;
  }
}

.navbar-counter {
  padding: 5px;
  font-size: 18px;
  border-radius: 5px;
  background-color: #718c00;
  color: #fff;
  vertical-align: middle;
}


.navbar-right {
  position: relative;
  float: right;
  margin-top: 10px;
  margin-right: 30px;
  height: 30px;
  font-size: 16px;
  color: #718c00;
}

.navbar-only-starred {
  color: #fece00;
}

.config {
  position: fixed;
  width: 900px;
  @media screen and (max-width: 900px) {
    width: 470px;
  }
  box-shadow: 0px 0px 0px 1000px hsla(0, 0%, 0%, 0.548);
  top: 50%;
  left: 50%;
  /* bring your own prefixes */
  transform: translate(-50%, -50%);
}
</style>
