<template>
  <div>
    <fixed-header :threshold="100">
      <div class="navbar">
        <div class="navbar-title">
          <span class="navbar-title-text">Appart aggregator</span>
          <span class="navbar-counter">{{apparts.length}}</span>
        </div>
        <button class="navbar-right" v-on:click="FetchAnnonces()">
          Fetch
          <i class="fa fa-refresh" :class="[{ 'fa-spin': loading }]" aria-hidden="true"></i>
        </button>
        <button class="navbar-right" v-on:click="OpenConfig()">
          Config
          <i class="fa fa-cog" aria-hidden="true"></i>
        </button>
        <button class="navbar-right navbar-only-starred" :class="[{'navbar-only-starred-active': onlyStarred }]" v-on:click="toggleOnlyStarred()">
          Only Starred
          <i v-if="!onlyStarred" class="fa fa-star-o" aria-hidden="true"></i>
          <i v-if="onlyStarred" class="fa fa-star" aria-hidden="true"></i>
        </button>
      </div>
    </fixed-header>
    <div class="container">
      <config v-if="showConfig" @close="CloseConfig">></config>
      <div v-if="displayedApparts.length == 0" class="no-apparts-message">No apparts to show, try changing your filters or wait a bit 😊</div>
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
import { HttpResponse } from 'vue-resource/types/vue_resource';

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
  public loading: boolean = false;

  private notificationService!: NotificationService;

  public mounted() {
    this.FetchAnnoncesLoop();

    this.notificationService = new NotificationService();
    this.notificationService.Init();
  }

  public OpenConfig() {
    this.showConfig = true;
  }

  public CloseConfig() {
    this.showConfig = false;
    this.FetchAnnonces();
  }

  public async FetchAnnonces() {
    this.loading = true;
    let responseApparts: HttpResponse;
    try {
      responseApparts = await this.$http.get('/api/apparts');
    } catch (e) {
      this.loading = false;
      console.error('Error fetching "/api/apparts"', e);
      return;
    }

    if (responseApparts.status != 200)
    {
      console.error('Error fetching "/api/apparts"', JSON.stringify(responseApparts));
      this.loading = false;
      return;
    }

    let currAppartIds = this.apparts.map(x => x.id);
    let newIds = responseApparts.data.map((x: any) => x.id).filter((id: string) => currAppartIds.findIndex(i => i === id) == -1);
    if (this.apparts.length != 0 && newIds.length != 0) {
      new Notification(`${newIds.length} New appartments have been found !`);
    }


    // Set the starred appart
    let responseStarredApparts: HttpResponse;
    try {
      responseStarredApparts = await this.$http.get('/api/apparts/starred');
    } catch(e) {
      this.loading = false;
      console.error('Error fetching "/api/apparts/starred"', e);
      return;
    }

    if (responseStarredApparts.status != 200)
    {
      console.error('Error fetching "/api/apparts/starred"', JSON.stringify(responseStarredApparts));
      this.loading = false;
      return;
    }

    let apparts: any[] = responseApparts.data;
    for (const appart of apparts)
      appart.isStarred = responseStarredApparts.data.findIndex((starredId: string) => appart.id == starredId) !== -1;

    this.apparts = apparts;
    this.computeDisplayedApparts();

    this.loading = false;
  }

  public toggleOnlyStarred() {
    this.onlyStarred = !this.onlyStarred;
    this.computeDisplayedApparts();
  }

  private FetchAnnoncesLoop() {
      this.FetchAnnonces()
      setTimeout(() => {
        this.FetchAnnoncesLoop();
      }, 30000);
  }

  private computeDisplayedApparts() {
    if (this.onlyStarred) {
      this.displayedApparts = this.apparts.filter(x => x.isStarred);
    } else {
      this.displayedApparts = this.apparts;
    }
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
button {
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

button {
  text-align: center;
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

.no-apparts-message {
  text-align: center;
}

.navbar {
  width: 100%;
  min-width: 480px;
  position: relative;
  background-color: #f7f7f7;
  height: 50px;
  box-shadow: 0px 0px 5px 1px #cccccc;
  z-index: 200;
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
    .navbar-title-text {
      display: none;
    }
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

.navbar-only-starred-active {
  border: 1px solid #fece00;
}
</style>
