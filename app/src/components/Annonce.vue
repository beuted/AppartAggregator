<template>
  <div class="panel">
    <div class="panel-heading">
      <a v-bind:href="annonce.url" target="_blank">{{annonce.departement}} - {{annonce.price}}€ - {{annonce.surfaceArea}}m² - {{annonce.origin}}</a>
      <button style="float:right;" v-on:click="excludeId(annonce.id)">X</button>
    </div>
    <div class="panel-body" v-bind:style="{ display: isExcluded ? 'none' : 'block' }">
      <div class="col-xs-6">
        <p>{{annonce.description}}</p>
      </div>
      <div class="col-xs-6" style="overflow-x: scroll; overflow-y: hidden; height: 220px;">
        <div style="width: max-content;">
          <img class="panel-picture" v-for="picture in annonce.photos" v-bind:src="picture" v-bind:key="picture">
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
  private annonce!: string;

  private isExcluded: boolean = false;

  public excludeId(id: string) {
    this.isExcluded = !this.isExcluded;
    this.$http.post(`/api/apparts/filter-id/${id}`, { value: this.isExcluded });
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

  .panel-picture {
    margin-left: 10px;
    margin-right: 10px;
    height: 200px;
    float:left;
  }
</style>
