import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  unlinkSync: vi.fn(),
}));

import { existsSync, unlinkSync } from 'fs';
import { deleteFile } from '../../../src/services/fileService';

const mockExistsSync = vi.mocked(existsSync);
const mockUnlinkSync = vi.mocked(unlinkSync);

describe('fileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deleteFile', () => {
    it('deletes file when it exists', () => {
      mockExistsSync.mockReturnValue(true);

      deleteFile('C:\\test\\file.lnk');

      expect(mockUnlinkSync).toHaveBeenCalledWith('C:\\test\\file.lnk');
    });

    it('does nothing when file does not exist', () => {
      mockExistsSync.mockReturnValue(false);

      deleteFile('C:\\test\\file.lnk');

      expect(mockUnlinkSync).not.toHaveBeenCalled();
    });

    it('does not throw when unlinkSync fails', () => {
      mockExistsSync.mockReturnValue(true);
      mockUnlinkSync.mockImplementation(() => { throw new Error('Permission denied'); });

      expect(() => deleteFile('C:\\test\\file.lnk')).not.toThrow();
    });
  });
});
