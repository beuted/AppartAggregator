<template>
  <div class="panel" :class="[{'starred': annonce.isStarred}]">
    <div class="panel-heading">
      <a :href="annonce.url" target="_blank">{{annonce.departement}} - {{annonce.price}}€ - {{annonce.surfaceArea}}m² - {{annonce.origin}}</a>
      <button class="panel-heading-button" v-on:click="excludeId(annonce.id)">
        <i v-if="!isExcluded" class="fa fa-trash"></i>
        <i v-if="isExcluded" class="fa fa-reply"></i>
      </button>
      <button class="panel-heading-button panel-heading-button-star" v-on:click="starId(annonce.id)">
        <i v-if="annonce.isStarred" class="fa fa-star"></i>
        <i v-if="!annonce.isStarred" class="fa fa-star-o"></i>
      </button>
    </div>
    <div class="panel-body" v-if="!isExcluded">
      <div>
        <p>{{annonce.description}}</p>
      </div>
      <div class="panel-pictures" v-if="annonce.photos.length != 0">
        <div class="panel-pictures-box">
          <img class="panel-pictures-box-item" v-for="(picture, index) in annonce.photos" v-bind:src="picture" v-bind:key="index">
        </div>
      </div>
      <div class="panel-body-date">
        {{formatDate(annonce.timestamp)}}
      </div>
      <div class="panel-body-notes">
        <textarea v-if="notesActivated" class="panel-body-notes-text" maxlength=3000 v-model="notes"></textarea>
        <button v-if="!notesActivated" class="panel-body-notes-button" v-on:click="InitAnnonceNotes()"><i class="fa fa-pencil" aria-hidden="true"></i></button>
        <button v-if="notesActivated" :disabled="!HasNoteChanged" class="panel-body-notes-button" v-on:click="SaveAnnonceNotes()"><i class="fa fa-save" aria-hidden="true"></i></button>
        <button v-if="notesActivated" class="panel-body-notes-button panel-body-notes-button-trash" v-on:click="DeleteAnnonceNotes()"><i class="fa fa-trash" aria-hidden="true"></i></button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import moment from 'moment';

@Component
export default class Annonce extends Vue {
  @Prop()
  private annonce!: any;

  private isExcluded: boolean = false;
  private notesActivated: boolean = false;
  private notes: string = '';

   public mounted() {
     this.notes = this.annonce.notes;
     this.notesActivated = !!this.annonce.notes;
   }

  public async excludeId(id: string) {
    await this.$http.post(`/api/apparts/filter-id/${id}`, { value: !this.isExcluded });
    this.isExcluded = !this.isExcluded;
  }

  public async starId(id: string) {
    await this.$http.post(`/api/apparts/starred/${id}`, { value: !this.annonce.isStarred });
    this.annonce.isStarred = !this.annonce.isStarred;
  }

  public InitAnnonceNotes() {
    this.notesActivated = true;
    this.notes = 'Notes:\r\n';
  }

  public async SaveAnnonceNotes() {
    try {
      await this.$http.post(`/api/apparts/${this.annonce.id}/notes`, { value: this.notes });
    } catch (e) {
      console.error(`Error fecthing "/api/apparts/${this.annonce.id}/notes"`, e);
      return;
    }
    Vue.set(this.annonce, 'notes', this.notes);
  }

  public async DeleteAnnonceNotes() {
    this.notesActivated = false;
    this.notes = '';
    await this.$http.post(`/api/apparts/${this.annonce.id}/notes`, { value: null });
  }

  public get HasNoteChanged() {
    return this.notes != this.annonce.notes;
  }

  public formatDate(ts :number): string {
    return moment(ts).fromNow();
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
    &.starred {
      border-left: 4px solid #fece00;
    }
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

  .panel-body-date {
    float: right;
    font-size: 12px;
    font-weight: bold;
    margin: 5px;
  }
  .panel-body-notes {
    margin-top: 15px;
  }

  .panel-body-notes-button {
    width: 35px;
    height: 30px;
    background-color: #718c00;
    color: #fff;
    &:hover {
      background-color: #2c3e50;
    }
    &:disabled {
      background-color: #718c004d;
      cursor: default;
    }
  }

  .panel-body-notes-button-trash {
    margin-left: 5px;
  }

  .panel-body-notes-text {
    width: 100%;
    resize: vertical;
    height: 100px;
  }
</style>
