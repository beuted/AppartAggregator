<template>
  <div class="panel">
    <div class="panel-heading">
      <a v-bind:href="annonce.url" target="_blank">{{annonce.departement}} - {{annonce.price}}€ - {{annonce.surfaceArea}}m² - {{annonce.origin}}</a>
      <button class="panel-heading-button" v-on:click="excludeId(annonce.id)">
        <i v-if="!isExcluded" class="fa fa-trash"></i>
        <i v-if="isExcluded" class="fa fa-reply"></i>
      </button>
      <button class="panel-heading-button panel-heading-button-star" v-on:click="starId(annonce.id)">
        <i v-if="annonce.isStarred" class="fa fa-star"></i>
        <i v-if="!annonce.isStarred" class="fa fa-star-o"></i>
      </button>
    </div>
    <div class="panel-body" v-bind:style="{ display: isExcluded ? 'none' : 'block' }">
      <div>
        <p>{{annonce.description}}</p>
      </div>
      <div class="panel-pictures" v-if="annonce.photos.length != 0">
        <div class="panel-pictures-box">
          <img class="panel-pictures-box-item" v-for="picture in annonce.photos" v-bind:src="picture" v-bind:key="picture">
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class Annonce extends Vue {
  @Prop()
  private annonce!: any;

  private isExcluded: boolean = false;

  public async excludeId(id: string) {
    await this.$http.post(`/api/apparts/filter-id/${id}`, { value: !this.isExcluded });
    this.isExcluded = !this.isExcluded;
  }

  public async starId(id: string) {
    await this.$http.post(`/api/apparts/starred/${id}`, { value: !this.annonce.isStarred });
    this.annonce.isStarred = !this.annonce.isStarred;
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
  .panel {
    background-color: #f7f7f7;
    padding: 15px;
    margin-bottom: 15px;
    border-left: 4px solid #718c00;
  }

  .panel-heading {
    font-weight: bold;
  }

  .panel-heading-button {
    float: right;
    width: 35px;
    height: 30px;
    font-size: 22px;
    color: #e43c47;
    .fa-reply {
      color: #2c3e50;
    }
  }

  .panel-heading-button-star {
    color: #fece00;
  }

  .panel-pictures {
    overflow-x: scroll;
    overflow-y: hidden;
    height: 220px;
  }
  .panel-pictures-box {
    width: max-content;
  }

  .panel-pictures-box-item {
    margin-left: 10px;
    margin-right: 10px;
    height: 200px;
    float:left;
  }
</style>
