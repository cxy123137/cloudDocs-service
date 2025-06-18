export async function addDocument(req) {
  const newDoc = {
    baseId: req.body.baseId || '',
    content: req.body.content || {},
    version: req.body.version || 0,
    snapshotAtVersion: req.body.snapshotAtVersion || null,
    snapshot: req.body.snapshot || ''
  };
  const result = await db.collection('docs').insertOne(newDoc);
  return result;
}

export async function getDocument(req) {
  let documents;
  if (req.query.id) {
    documents = await db.collection('docs').findOne({_id: new ObjectId(req.query.id), valid: 1});
  } else {
    documents = await db.collection('docs').find({valid: 1}).toArray();
  }
  return documents;
}

export async function updateDocument(req) {
  const documentData = {
    title: req.body.title,
    content: req.body.content,
    valid: req.body.valid,
    updateTime: new Date(),
  };
  const result = await db.collection('documents').updateOne({_id: new ObjectId(req.body._id)}, {$set: documentData});
  return result;
}

export async function deleteDocument(req) {
  const result = await db.collection('documents').deleteOne({_id: new ObjectId(req.body._id)});
  return result;
}