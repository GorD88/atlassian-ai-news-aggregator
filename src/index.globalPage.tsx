/**
 * Global page entry point
 * Using Forge UI (UI Kit 2) instead of Custom UI
 */

import ForgeUI, { render, Text, Fragment, useState, Button, Form, TextField, TextArea, Checkbox } from '@forge/ui';
import { loadConfig, upsertFeed, removeFeed } from './services/configManager';
import { FeedConfig } from './types/config';

const GlobalPageUI = () => {
  const [config, setConfig] = useState(async () => await loadConfig());
  const [showForm, setShowForm] = useState(false);
  
  const handleAddFeed = () => {
    setShowForm(true);
  };
  
  const handleSaveFeed = async (formData: any) => {
    const feed: FeedConfig = {
      id: `feed-${Date.now()}`,
      name: formData.name,
      url: formData.url,
      keywords: formData.keywords.split('\n').map((k: string) => k.trim()).filter((k: string) => k),
      enabled: formData.enabled || true,
    };
    
    await upsertFeed(feed);
    const newConfig = await loadConfig();
    setConfig(newConfig);
    setShowForm(false);
  };
  
  const handleDeleteFeed = async (feedId: string) => {
    await removeFeed(feedId);
    const newConfig = await loadConfig();
    setConfig(newConfig);
  };
  
  return (
    <Fragment>
      <Text>
        <Text content="# AI News Aggregator Configuration" />
      </Text>
      
      <Text>
        <Text content="## Feed Sources" />
      </Text>
      
      {config && config.feeds && config.feeds.map((feed: FeedConfig) => (
        <Fragment key={feed.id}>
          <Text content={`**${feed.name}**`} />
          <Text content={`URL: ${feed.url}`} />
          <Text content={`Keywords: ${feed.keywords.join(', ')}`} />
          <Text content={`Enabled: ${feed.enabled ? 'Yes' : 'No'}`} />
          <Button text="Delete" onClick={() => handleDeleteFeed(feed.id)} />
        </Fragment>
      ))}
      
      <Button text="Add New Feed" onClick={handleAddFeed} />
      
      {showForm && (
        <Form onSubmit={handleSaveFeed} submitButtonText="Save Feed">
          <TextField name="name" label="Feed Name" isRequired />
          <TextField name="url" label="Feed URL" isRequired />
          <TextArea name="keywords" label="Keywords (one per line)" isRequired />
          <Checkbox name="enabled" label="Enabled" defaultChecked />
        </Form>
      )}
    </Fragment>
  );
};

export const globalPage = render(
  <GlobalPageUI />
);

