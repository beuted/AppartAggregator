<template>
  <div class="panel">
    <div class="panel-section">
      <div class="panel-title">Excluded Keywords</div>
    </div>
    <div class="panel-section">
      <span class="label" v-for="excludedKeyword in config.excludedKeywords" :key="excludedKeyword">
        {{excludedKeyword}}
        <button v-on:click="UpdateExcludedKeyword(excludedKeyword, false)">
          <i class="fa fa-times"></i>
        </button>
      </span>
    </div>
    <div class="panel-section">
      <input type="text" v-model="keywordInput"/> <button class="label-input" v-on:click="UpdateExcludedKeyword(keywordInput, true)">Add +</button>
    </div>

    <div class="panel-section">
      <div class="panel-title">Excluded Ids</div>
    </div>
    <div class="panel-section scroll-section">
      <span class="label" v-for="excludedId in config.excludedIds" :key="excludedId">{{excludedId}}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class Annonce extends Vue {
  public config: any = {
    excludedIds: [],
    excludedKeywords: [],
    searchUrls:{
      seLoger: null,
      pap: null,
      bienIci: null
    }
  };

  public keywordInput: string = "";

  public mounted() {
      this.fetchConfig();
  }

  public fetchConfig() {
    this.$http.get('/api/apparts/config').then(response => {
      if (response.status == 200)
      {
        this.config = response.data;
      }
      else
      {
        console.error(JSON.stringify(response));
        this.config = null;
      }
    }, response => {
        console.error(JSON.stringify(response));
        this.config = null;
    });
  }

  public async UpdateExcludedKeyword(keyword, excluded) {
    return await this.$http.post('/api/apparts/config/excluded-keyword', { keyword: keyword, excluded: excluded}).then(response => {
      if (response.status == 200)
      {
        if (excluded) {
          this.config.excludedKeywords.push(keyword);
        } else {
          // Remove elements matching from list
          for (var i = this.config.excludedKeywords.length - 1; i >= 0; i--) {
            if(this.config.excludedKeywords[i] === keyword) {
              this.config.excludedKeywords.splice(i, 1);
            }
          }
        }
      }
      else
      {
        console.error(JSON.stringify(response));
        this.config = null;
      }
    }, response => {
        console.error(JSON.stringify(response));
        this.config = null;
    });
  }

  private async SaveKeyword() {

  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
  .panel {
    background-color: #f7f7f7;
    padding: 15px;
    margin-bottom: 15px;
  }

  .panel-title {
    font-weight: bold;
  }

  .label {
    background-color: #e43c47;
    border-radius: 8px;
    padding: 2px 5px 2px 5px;
    margin-left: 5px;
  }

  .label-input {
    background-color: #2c3e50;
    color: #fff;
    padding: 2px 5px 2px 5px;
    margin-left: 5px;
  }

  .panel-section {
    margin-bottom: 10px;
    input {
      height: 18px;
    }
  }

  .scroll-section {
    max-height: 150px;
    overflow: auto;
  }
</style>
